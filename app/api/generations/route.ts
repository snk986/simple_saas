import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audioProvider } from "@/lib/audio";
import { matchSongStyle } from "@/config/styles";
import { createClient } from "@/utils/supabase/server";
import {
  getSongExpiryForEntitlements,
  getUserEntitlements,
} from "@/lib/subscription/entitlements";
import {
  buildStructuredUserInput,
  generateLyricsPreview,
  normalizeSongLocale,
} from "@/lib/song/lyrics-generation";
import { ERROR_CODES } from "@/lib/observability/error-codes";
import {
  classifyProviderError,
  elapsedMs,
  getClientContext,
  getRequestId,
  logError,
  logInfo,
} from "@/lib/observability/log";

const AUDIO_CREDIT_COST = 200;

const requestSchema = z.object({
  mode: z.enum(["text", "lyrics"]).default("text"),
  prompt: z.string().trim().max(2000).optional(),
  lyrics: z.string().trim().max(10000).optional(),
  style: z.string().trim().max(300).optional(),
  title: z.string().trim().max(120).optional(),
  locale: z.string().trim().optional(),
  instrumental: z.boolean().optional(),
});

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function getCreditBalance(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("customers")
    .select("credits_balance")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.credits_balance ?? null;
}

async function freezeCreditIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  requestId: string,
) {
  if (process.env.SKIP_CREDIT_CHECK === "true") {
    return { enough: true, charged: false };
  }

  const before = await getCreditBalance(supabase, userId);
  const { data, error } = await supabase.rpc("freeze_credit", {
    p_user_id: userId,
    p_amount: AUDIO_CREDIT_COST,
    p_description: "song_generation",
    p_metadata: { operation: "song_generation", request_id: requestId },
  });

  if (error) {
    logError("credit_freeze", {
      request_id: requestId,
      user_id: userId,
      op: "freeze",
      stage: "credit_finalize",
      status: "failed",
      error_code: ERROR_CODES.CREDIT_OP_FAILED,
      failure_reason: error.message,
      balance_before: before,
      amount: AUDIO_CREDIT_COST,
      balance_after: null,
      success: false,
    });
    throw error;
  }

  const enough = Boolean((data as { enough?: boolean } | null)?.enough);
  const after = await getCreditBalance(supabase, userId);
  logInfo("credit_freeze", {
    request_id: requestId,
    user_id: userId,
    op: "freeze",
    stage: "credit_finalize",
    status: enough ? "succeeded" : "insufficient",
    balance_before: before,
    amount: AUDIO_CREDIT_COST,
    balance_after: after,
    success: enough,
  });

  return { enough, charged: enough };
}

async function refundCreditIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  charged: boolean,
  requestId: string,
  songId: string | null,
) {
  if (!charged || process.env.SKIP_CREDIT_CHECK === "true") {
    return;
  }

  const before = await getCreditBalance(supabase, userId);
  const { error } = await supabase.rpc("unfreeze_credit", {
    p_user_id: userId,
    p_amount: AUDIO_CREDIT_COST,
    p_description: "song_generation_refund",
    p_metadata: {
      operation: "song_generation",
      request_id: requestId,
      song_id: songId,
    },
  });

  if (error) {
    logError("credit_refund", {
      request_id: requestId,
      user_id: userId,
      song_id: songId,
      op: "refund",
      stage: "credit_finalize",
      status: "failed",
      error_code: ERROR_CODES.CREDIT_OP_FAILED,
      failure_reason: error.message,
      balance_before: before,
      amount: AUDIO_CREDIT_COST,
      balance_after: null,
      success: false,
    });
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request.headers.get("x-request-id"));
  const requestStart = Date.now();
  const client = getClientContext(request.headers.get("user-agent"));
  const supabase = await createClient();
  let charged = false;
  let userId: string | null = null;
  let songId: string | null = null;

  try {
    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = user.id;
    const mode = parsed.data.mode;
    const locale = normalizeSongLocale(parsed.data.locale);
    const prompt = parsed.data.prompt?.trim() ?? "";
    const requestedTitle = parsed.data.title?.trim() ?? "";
    const requestedStyle = parsed.data.style?.trim() ?? "";

    if (mode === "text" && prompt.length < 10) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (mode === "lyrics" && (parsed.data.lyrics?.trim().length ?? 0) < 20) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    logInfo("song_generate_start", {
      request_id: requestId,
      user_id: user.id,
      stage: "generation_submit",
      status: "started",
      ...client,
    });

    const userInput = buildStructuredUserInput({
      mode,
      prompt: prompt || (mode === "lyrics" ? "Custom lyrics provided" : ""),
      style: requestedStyle,
      title: requestedTitle,
    });
    const prepared =
      mode === "text"
        ? await generateLyricsPreview({
            userInput,
            locale,
          })
        : {
            flagged: false as const,
            locale,
            title: requestedTitle || "My AI Song",
            lyrics: parsed.data.lyrics!.trim(),
            style: matchSongStyle({
              story: `${requestedStyle} ${prompt} ${parsed.data.lyrics}`,
            }),
          };

    if (prepared.flagged) {
      return NextResponse.json(
        { error: "Content flagged", reason: prepared.reason },
        { status: 400 },
      );
    }

    const entitlements = await getUserEntitlements(user.id);
    const credit = await freezeCreditIfNeeded(supabase, user.id, requestId);
    charged = credit.charged;

    if (!credit.enough) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 },
      );
    }

    const title = requestedTitle || prepared.title;
    const { data: song, error: insertError } = await supabase
      .from("songs")
      .insert({
        user_id: user.id,
        title,
        lyrics: prepared.lyrics,
        user_input: userInput,
        style_key: prepared.style.key,
        style_params: prepared.style.params,
        style_tags: prepared.style.tags,
        locale: prepared.locale,
        status: "generating",
        is_public: true,
        audio_provider: audioProvider.name,
        audio_provider_task_id: "",
        audio_provider_status: "submitting",
        expires_at: getSongExpiryForEntitlements(entitlements),
      })
      .select("id")
      .single();

    if (insertError || !song) {
      throw insertError ?? new Error("Failed to create song");
    }

    songId = song.id;
    const { taskId, providerStatus } = await audioProvider.generateSong({
      title,
      lyrics: prepared.lyrics,
      prompt: prepared.style.prompt,
      make_instrumental: Boolean(parsed.data.instrumental),
    });

    const { error: updateError } = await supabase
      .from("songs")
      .update({
        audio_provider_task_id: taskId,
        audio_provider_status: providerStatus ?? "submitted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", song.id)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    charged = false;
    logInfo("song_generate_success", {
      request_id: requestId,
      user_id: user.id,
      song_id: song.id,
      stage: "generation_submit",
      status: "succeeded",
      duration_ms: elapsedMs(requestStart),
      provider_task_id: taskId,
      ...client,
    });

    return NextResponse.json({
      request_id: requestId,
      jobId: song.id,
      songId: song.id,
      taskId,
      status: "processing",
    });
  } catch (error) {
    if (userId) {
      if (songId) {
        await supabase
          .from("songs")
          .update({
            status: "failed",
            audio_provider_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", songId)
          .eq("user_id", userId);
      }
      await refundCreditIfNeeded(supabase, userId, charged, requestId, songId);
    }

    const providerError = classifyProviderError(error);
    logError("song_generate_failed", {
      request_id: requestId,
      user_id: userId,
      song_id: songId,
      stage: "generation_submit",
      status: "failed",
      duration_ms: elapsedMs(requestStart),
      error_code: providerError.error_code,
      provider_error_code: providerError.provider_error_code,
      provider_message: providerError.provider_message,
      ...client,
    });
    return NextResponse.json(
      { error: "Generation failed", request_id: requestId },
      { status: 500 },
    );
  }
}
