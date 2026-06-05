import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import {
  classifyProviderError,
  elapsedMs,
  getClientContext,
  getRequestId,
  logError,
  logInfo,
} from "@/lib/observability/log";
import { validationError } from "@/lib/api/errors";
import { finalizeAudioGeneration } from "@/lib/audio/finalize-generation";

const querySchema = z.object({
  songId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  const requestId = getRequestId(
    request.headers.get("x-request-id") ??
      request.nextUrl.searchParams.get("request_id"),
  );
  const startMs = Date.now();
  const client = getClientContext(request.headers.get("user-agent"));
  const supabase = await createClient();
  let currentUserId: string | null = null;
  let currentSongId: string | null = null;

  try {
    const query = querySchema.safeParse({
      songId: request.nextUrl.searchParams.get("songId") ?? undefined,
    });

    if (!query.success) {
      return validationError(query.error);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    currentUserId = user.id;
    currentSongId = query.data.songId;

    logInfo("audio_poll_start", {
      request_id: requestId,
      user_id: user.id,
      song_id: query.data.songId ?? null,
      stage: "audio_poll",
      status: "started",
      ...client,
    });

    const result = await finalizeAudioGeneration({
      songId: query.data.songId,
      requestId,
      source: "poll",
      userId: user.id,
    });

    if (result.status === "not_found") {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    if (result.status === "completed") {
      logInfo("song_generate_success", {
        request_id: requestId,
        user_id: user.id,
        song_id: result.songId,
        stage: "audio_poll",
        status: "succeeded",
        duration_ms: elapsedMs(startMs),
        ...client,
      });
      return NextResponse.json({
        status: "completed",
        songId: result.songId,
        audioUrl: result.audioUrl,
        coverUrl: result.coverUrl,
        altSongId: result.altSongId,
        altAudioUrl: result.altAudioUrl,
        altCoverUrl: result.altCoverUrl,
        errorMessage: null,
      });
    }

    if (result.status === "failed") {
      logError("song_generate_failed", {
        request_id: requestId,
        user_id: user.id,
        song_id: result.songId,
        stage: "audio_poll",
        status: "failed",
        duration_ms: elapsedMs(startMs),
        failure_reason: result.errorMessage,
        ...client,
      });
      return NextResponse.json({
        status: "failed",
        songId: result.songId,
        errorMessage: result.errorMessage,
      });
    }

    return NextResponse.json({
      status: "generating",
      songId: result.songId,
      errorMessage: null,
    });
  } catch (error) {
    const providerError = classifyProviderError(error);
    const eventName =
      providerError.error_code === "TIMEOUT"
        ? "song_generate_timeout"
        : "song_generate_failed";

    logError(eventName, {
      request_id: requestId,
      user_id: currentUserId,
      song_id: currentSongId,
      stage: "audio_poll",
      status: "failed",
      duration_ms: elapsedMs(startMs),
      error_code: providerError.error_code,
      provider_error_code: providerError.provider_error_code,
      provider_message: providerError.provider_message,
      ...client,
    });

    return NextResponse.json(
      { error: "Failed to check audio status", request_id: requestId },
      { status: 500 },
    );
  }
}
