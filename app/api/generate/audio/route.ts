import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audioProvider } from "@/lib/audio";
import { getSongStyle } from "@/config/styles";
import { createClient } from "@/utils/supabase/server";
import {
  getSongExpiryForEntitlements,
  getUserEntitlements,
} from "@/lib/subscription/entitlements";
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
  songId: z.string().uuid(),
  lyrics: z.string().trim().min(20).max(10000).optional(),
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
  songId: string,
) {
  if (process.env.SKIP_CREDIT_CHECK === "true") {
    return { enough: true, charged: false };
  }

  const before = await getCreditBalance(supabase, userId);
  const { data, error } = await supabase.rpc("freeze_credit", {
    p_user_id: userId,
    p_amount: AUDIO_CREDIT_COST,
    p_description: "audio_generation",
    p_metadata: {
      operation: "audio_generation",
      request_id: requestId,
      song_id: songId,
    },
  });

  if (error) {
    logError("credit_freeze", {
      request_id: requestId,
      user_id: userId,
      song_id: songId,
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
    song_id: songId,
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
    p_description: "audio_generation_refund",
    p_metadata: {
      operation: "audio_generation",
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
    return;
  }

  const after = await getCreditBalance(supabase, userId);
  logInfo("credit_refund", {
    request_id: requestId,
    user_id: userId,
    song_id: songId,
    op: "refund",
    stage: "credit_finalize",
    status: "succeeded",
    balance_before: before,
    amount: AUDIO_CREDIT_COST,
    balance_after: after,
    success: true,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const requestId = getRequestId(request.headers.get("x-request-id"));
  const startMs = Date.now();
  const client = getClientContext(request.headers.get("user-agent"));
  let charged = false;
  let userId: string | null = null;
  let songId: string | null = null;

  try {
    const body = requestSchema.safeParse(await request.json());

    if (!body.success) {
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
    songId = body.data.songId;
    const entitlements = await getUserEntitlements(user.id);
    const { data: song, error: songError } = await supabase
      .from("songs")
      .select("id,title,lyrics,style_key,user_id,status,expires_at")
      .eq("id", body.data.songId)
      .eq("user_id", user.id)
      .single();

    if (songError || !song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    if (song.status === "generating") {
      return NextResponse.json(
        { error: "Audio is already generating" },
        { status: 400 },
      );
    }

    logInfo("song_generate_start", {
      request_id: requestId,
      user_id: user.id,
      song_id: song.id,
      stage: "audio_submit",
      status: "started",
      ...client,
    });

    const credit = await freezeCreditIfNeeded(
      supabase,
      user.id,
      requestId,
      song.id,
    );
    charged = credit.charged;

    if (!credit.enough) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 },
      );
    }

    const lyrics = body.data.lyrics ?? song.lyrics;
    const style = getSongStyle(song.style_key);
    const { taskId, providerStatus } = await audioProvider.generateSong({
      title: song.title,
      lyrics,
      prompt: style.prompt,
      make_instrumental: false,
    });

    const { error: updateError } = await supabase
      .from("songs")
      .update({
        lyrics,
        status: "generating",
        audio_provider: audioProvider.name,
        audio_provider_task_id: taskId,
        audio_provider_status: providerStatus ?? "submitted",
        expires_at: entitlements.canKeepSongsForever
          ? null
          : (song.expires_at ?? getSongExpiryForEntitlements(entitlements)),
        updated_at: new Date().toISOString(),
      })
      .eq("id", song.id)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    charged = false;
    logInfo("audio_submit_end", {
      request_id: requestId,
      user_id: user.id,
      song_id: song.id,
      stage: "audio_submit",
      status: "succeeded",
      duration_ms: elapsedMs(startMs),
      provider_task_id: taskId,
      ...client,
    });
    return NextResponse.json({
      songId: song.id,
      status: "generating",
      title: song.title,
    });
  } catch (error) {
    if (userId) {
      await refundCreditIfNeeded(supabase, userId, charged, requestId, songId);
    }

    const providerError = classifyProviderError(error);
    const eventName =
      providerError.error_code === "TIMEOUT"
        ? "song_generate_timeout"
        : "song_generate_failed";
    logError(eventName, {
      request_id: requestId,
      user_id: userId,
      song_id: songId,
      stage: "audio_submit",
      status: "failed",
      duration_ms: elapsedMs(startMs),
      error_code: providerError.error_code,
      provider_error_code: providerError.provider_error_code,
      provider_message: providerError.provider_message,
      ...client,
    });
    return NextResponse.json(
      { error: "Audio generation failed", request_id: requestId },
      { status: 500 },
    );
  }
}
