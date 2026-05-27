import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { generateLyricsPreview } from "@/lib/song/lyrics-generation";
import {
  classifyProviderError,
  elapsedMs,
  getClientContext,
  getRequestId,
  logError,
  logInfo,
} from "@/lib/observability/log";
import { invalidJsonRequest, validationError } from "@/lib/api/errors";

const requestSchema = z.object({
  userInput: z.string().trim().min(10).max(2000),
  locale: z.string().trim().optional(),
  currentLyrics: z.string().trim().max(8000).optional(),
});

function isPreviewRuntime() {
  return process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production";
}

function errorDetail(error: unknown) {
  if (!isPreviewRuntime()) {
    return undefined;
  }

  return error instanceof Error ? error.message : String(error);
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request.headers.get("x-request-id"));
  const requestStart = Date.now();
  const client = getClientContext(request.headers.get("user-agent"));

  try {
    const payload = await request.json().catch(() => null);

    if (!payload) {
      return invalidJsonRequest();
    }

    const body = requestSchema.safeParse(payload);

    if (!body.success) {
      return validationError(body.error);
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logInfo("song_generate_start", {
      request_id: requestId,
      user_id: user.id,
      stage: "lyrics",
      status: "started",
      ...client,
    });

    const preview = await generateLyricsPreview({
      userInput: body.data.userInput,
      locale: body.data.locale,
      previousLyrics: body.data.currentLyrics,
    });

    if (preview.flagged) {
      return NextResponse.json(
        { error: "Content flagged", reason: preview.reason },
        { status: 400 },
      );
    }

    logInfo("song_generate_success", {
      request_id: requestId,
      user_id: user.id,
      stage: "lyrics",
      status: "succeeded",
      duration_ms: elapsedMs(requestStart),
      ...client,
    });

    return NextResponse.json({
      request_id: requestId,
      title: preview.title,
      lyrics: preview.lyrics,
      style_key: preview.style.key,
      style_params: preview.style.params,
      style_tags: preview.style.tags,
      style_prompt: preview.style.prompt,
      vocal_casting: preview.vocalCasting,
      generation_notes: preview.generationNotes,
      lyrics_regen_count: 1,
    });
  } catch (error) {
    const providerError = classifyProviderError(error);
    const eventName =
      providerError.error_code === "TIMEOUT"
        ? "song_generate_timeout"
        : "song_generate_failed";
    logError(eventName, {
      request_id: requestId,
      stage: "lyrics",
      status: "failed",
      duration_ms: elapsedMs(requestStart),
      error_code: providerError.error_code,
      provider_error_code: providerError.provider_error_code,
      provider_message: providerError.provider_message,
      ...client,
    });
    return NextResponse.json(
      {
        error: "Generation failed",
        detail: errorDetail(error),
      },
      { status: 500 },
    );
  }
}
