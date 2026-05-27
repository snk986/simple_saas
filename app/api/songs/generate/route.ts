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
import {
  freezeAudioGenerationCredit,
  refundAudioGenerationCredit,
} from "@/lib/credits/audio-generation";
import {
  classifyProviderError,
  elapsedMs,
  getClientContext,
  getRequestId,
  logError,
  logInfo,
} from "@/lib/observability/log";
import {
  invalidJsonRequest,
  invalidRequest,
  validationError,
} from "@/lib/api/errors";

const requestSchema = z.object({
  mode: z.enum(["text", "lyrics"]).default("text"),
  prompt: z.string().trim().max(2000).optional(),
  lyrics: z.string().trim().max(10000).optional(),
  style: z.string().trim().max(1000).optional(),
  title: z.string().trim().max(120).optional(),
  locale: z.string().trim().optional(),
  instrumental: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request.headers.get("x-request-id"));
  const requestStart = Date.now();
  const client = getClientContext(request.headers.get("user-agent"));
  const supabase = await createClient();
  let charged = false;
  let userId: string | null = null;
  let songId: string | null = null;
  let creditCost = 0;

  try {
    creditCost = audioProvider.creditCost;
    const body = await request.json().catch(() => null);

    if (!body) {
      return invalidJsonRequest();
    }

    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
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
      return invalidRequest(["prompt: Must be at least 10 characters"]);
    }

    if (mode === "lyrics" && (parsed.data.lyrics?.trim().length ?? 0) < 20) {
      return invalidRequest(["lyrics: Must be at least 20 characters"]);
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
    const matchedStyle = matchSongStyle({
      story: `${requestedStyle} ${prompt} ${parsed.data.lyrics ?? ""}`,
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
            style: {
              ...matchedStyle,
              prompt: requestedStyle || matchedStyle.prompt,
            },
          };

    if (prepared.flagged) {
      return NextResponse.json(
        { error: "Content flagged", reason: prepared.reason },
        { status: 400 },
      );
    }

    const entitlements = await getUserEntitlements(user.id);
    const credit = await freezeAudioGenerationCredit({
      supabase,
      userId: user.id,
      requestId,
      creditCost,
      description: "song_generation",
      metadata: { operation: "song_generation" },
    });
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
        is_public: false,
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
    const { taskId: providerRequestId, providerStatus } =
      await audioProvider.generateSong({
        title,
        lyrics: prepared.lyrics,
        prompt: prepared.style.prompt,
        make_instrumental: Boolean(parsed.data.instrumental),
      });

    const { error: updateError } = await supabase
      .from("songs")
      .update({
        audio_provider_task_id: providerRequestId,
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
      provider_task_id: providerRequestId,
      ...client,
    });

    return NextResponse.json({
      songId: song.id,
      status: "generating",
      title,
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
      if (charged) {
        await refundAudioGenerationCredit({
          supabase,
          userId,
          requestId,
          songId,
          creditCost,
          description: "song_generation_refund",
          metadata: { operation: "song_generation" },
        });
      }
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
