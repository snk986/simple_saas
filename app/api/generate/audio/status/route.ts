import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAudioProviderByName } from "@/lib/audio";
import {
  uploadPollinationsCover,
  uploadRemoteMedia,
} from "@/lib/audio/storage";
import { checkAchievements } from "@/lib/achievements/check-achievements";
import { refundAudioGenerationCredit } from "@/lib/credits/audio-generation";
import { getUserEntitlements } from "@/lib/subscription/entitlements";
import { createClient } from "@/utils/supabase/server";
import { ERROR_CODES } from "@/lib/observability/error-codes";
import {
  classifyProviderError,
  elapsedMs,
  getClientContext,
  getRequestId,
  logError,
  logInfo,
} from "@/lib/observability/log";

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
  let currentSong: {
    id: string;
    audio_provider: string;
    audio_provider_task_id: string | null;
  } | null = null;

  try {
    const query = querySchema.safeParse({
      songId: request.nextUrl.searchParams.get("songId") ?? undefined,
    });

    if (!query.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    currentUserId = user.id;

    logInfo("audio_poll_start", {
      request_id: requestId,
      user_id: user.id,
      song_id: query.data.songId ?? null,
      stage: "audio_poll",
      status: "started",
      ...client,
    });

    const songQuery = supabase
      .from("songs")
      .select(
        "id,title,lyrics,user_input,status,audio_provider,audio_provider_task_id,audio_provider_status,audio_url,audio_url_alt,cover_url,lyrics_regen_count,style_key,style_params,style_tags,locale,user_id,is_public,expires_at,created_at",
      )
      .eq("user_id", user.id)
      .eq("id", query.data.songId);

    const { data: song, error: songError } = await songQuery.maybeSingle();

    if (songError || !song || !song.audio_provider) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    currentSong = {
      id: song.id,
      audio_provider: song.audio_provider,
      audio_provider_task_id: song.audio_provider_task_id,
    };

    if (song.status === "ready") {
      logInfo("song_generate_success", {
        request_id: requestId,
        user_id: user.id,
        song_id: song.id,
        stage: "audio_poll",
        status: "succeeded",
        duration_ms: elapsedMs(startMs),
        ...client,
      });
      return NextResponse.json({
        status: "completed",
        songId: song.id,
        audioUrl: song.audio_url,
        coverUrl: song.cover_url,
        errorMessage: null,
      });
    }

    if (song.status === "failed") {
      logError("song_generate_failed", {
        request_id: requestId,
        user_id: user.id,
        song_id: song.id,
        stage: "audio_poll",
        status: "failed",
        duration_ms: elapsedMs(startMs),
        error_code: ERROR_CODES.BAD_RESPONSE,
        failure_reason: "song_already_failed",
        ...client,
      });
      return NextResponse.json({
        status: "failed",
        songId: song.id,
        errorMessage: "Song generation failed. Please try again.",
      });
    }

    const provider = getAudioProviderByName(song.audio_provider);

    if (!song.audio_provider_task_id) {
      await supabase
        .from("songs")
        .update({
          status: "failed",
          audio_provider_status: "missing_provider_request_id",
          updated_at: new Date().toISOString(),
        })
        .eq("id", song.id)
        .eq("user_id", user.id);
      await refundAudioGenerationCredit({
        supabase,
        userId: user.id,
        requestId,
        songId: song.id,
        creditCost: provider.creditCost,
        description: "audio_generation_refund",
        metadata: { operation: "audio_generation" },
      });

      logError("song_generate_failed", {
        request_id: requestId,
        user_id: user.id,
        song_id: song.id,
        stage: "audio_poll",
        status: "failed",
        duration_ms: elapsedMs(startMs),
        error_code: ERROR_CODES.BAD_RESPONSE,
        failure_reason: "missing_provider_request_id",
        ...client,
      });

      return NextResponse.json({
        status: "failed",
        songId: song.id,
        errorMessage: "Song generation failed. Please try again.",
      });
    }

    const entitlements = await getUserEntitlements(user.id);
    const result = await provider.getTaskStatus(song.audio_provider_task_id);

    if (result.status === "processing") {
      if (result.providerStatus) {
        await supabase
          .from("songs")
          .update({
            audio_provider_status: result.providerStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", song.id)
          .eq("user_id", user.id);
      }
      return NextResponse.json({
        status: "generating",
        songId: song.id,
        errorMessage: null,
      });
    }

    if (result.status === "failed" || result.songs.length === 0) {
      await supabase
        .from("songs")
        .update({
          status: "failed",
          audio_provider_status: result.providerStatus ?? "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", song.id)
        .eq("user_id", user.id);
      await refundAudioGenerationCredit({
        supabase,
        userId: user.id,
        requestId,
        songId: song.id,
        creditCost: provider.creditCost,
        description: "audio_generation_refund",
        metadata: { operation: "audio_generation" },
      });

      logError("song_generate_timeout", {
        request_id: requestId,
        user_id: user.id,
        song_id: song.id,
        stage: "audio_poll",
        status: "failed",
        duration_ms: elapsedMs(startMs),
        error_code: ERROR_CODES.TIMEOUT,
        provider_task_id: song.audio_provider_task_id,
        provider_message: result.error ?? "provider returned failed",
        ...client,
      });

      return NextResponse.json({
        status: "failed",
        songId: song.id,
        errorMessage:
          result.error ?? "Song generation failed. Please try again.",
      });
    }

    const primary = result.songs[0];
    const alt = result.songs[1];
    const pathPrefix = `songs/${song.id}/audio`;
    const audioUrl = await uploadRemoteMedia({
      url: primary.audio_url,
      pathPrefix,
      fileName: "primary",
      fallbackExtension: "mp3",
    });

    const coverUrl = primary.image_url
      ? await uploadRemoteMedia({
          url: primary.image_url,
          pathPrefix: `songs/${song.id}/cover`,
          fileName: "cover",
          fallbackExtension: "jpg",
        })
      : await uploadPollinationsCover({
          songId: song.id,
          title: song.title,
          styleTags: song.style_tags ?? [],
        });

    const readyUpdate: Record<string, unknown> = {
      audio_url: audioUrl,
      audio_url_alt: null,
      cover_url: coverUrl,
      status: "ready",
      selected_audio: "primary",
      audio_provider_status: result.providerStatus ?? "completed",
      updated_at: new Date().toISOString(),
    };

    if (entitlements.canKeepSongsForever) {
      readyUpdate.expires_at = null;
    }

    const { error: updateError } = await supabase
      .from("songs")
      .update(readyUpdate)
      .eq("id", song.id)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    let altSong: {
      id: string;
      audio_url: string | null;
      cover_url: string | null;
    } | null = null;

    if (alt) {
      const altTitle = alt.title?.trim() || `${song.title} (Version B)`;
      const { data: insertedAltSong, error: insertAltError } = await supabase
        .from("songs")
        .insert({
          user_id: user.id,
          title:
            altTitle === song.title ? `${song.title} (Version B)` : altTitle,
          lyrics: song.lyrics,
          user_input: song.user_input,
          style_key: song.style_key,
          style_params: song.style_params,
          style_tags: song.style_tags,
          locale: song.locale,
          status: "generating",
          audio_provider: song.audio_provider,
          audio_provider_task_id: `${song.audio_provider_task_id}:alt`,
          audio_provider_status: result.providerStatus ?? "completed",
          is_public: song.is_public,
          expires_at: entitlements.canKeepSongsForever ? null : song.expires_at,
        })
        .select("id")
        .single();

      if (insertAltError || !insertedAltSong) {
        throw insertAltError ?? new Error("Failed to create alternate song");
      }

      const altAudioUrl = await uploadRemoteMedia({
        url: alt.audio_url,
        pathPrefix: `songs/${insertedAltSong.id}/audio`,
        fileName: "primary",
        fallbackExtension: "mp3",
      });
      const altCoverUrl = alt.image_url
        ? await uploadRemoteMedia({
            url: alt.image_url,
            pathPrefix: `songs/${insertedAltSong.id}/cover`,
            fileName: "cover",
            fallbackExtension: "jpg",
          })
        : coverUrl;

      const { data: readyAltSong, error: updateAltError } = await supabase
        .from("songs")
        .update({
          audio_url: altAudioUrl,
          cover_url: altCoverUrl,
          status: "ready",
          selected_audio: "primary",
          audio_provider_status: result.providerStatus ?? "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", insertedAltSong.id)
        .eq("user_id", user.id)
        .select("id,audio_url,cover_url")
        .single();

      if (updateAltError || !readyAltSong) {
        throw updateAltError ?? new Error("Failed to store alternate song");
      }

      altSong = readyAltSong;
    }

    await checkAchievements(user.id).catch((achievementError) => {
      logError("achievement_check_failed", {
        request_id: requestId,
        user_id: user.id,
        song_id: song.id,
        stage: "audio_poll",
        status: "failed",
        error_code: ERROR_CODES.BAD_RESPONSE,
        failure_reason:
          achievementError instanceof Error
            ? achievementError.message
            : String(achievementError),
        ...client,
      });
    });

    logInfo("song_generate_success", {
      request_id: requestId,
      user_id: user.id,
      song_id: song.id,
      stage: "audio_poll",
      status: "succeeded",
      duration_ms: elapsedMs(startMs),
      provider_task_id: song.audio_provider_task_id,
      ...client,
    });

    return NextResponse.json({
      status: "completed",
      songId: song.id,
      audioUrl,
      coverUrl,
      altSongId: altSong?.id,
      altAudioUrl: altSong?.audio_url,
      altCoverUrl: altSong?.cover_url,
      errorMessage: null,
    });
  } catch (error) {
    const providerError = classifyProviderError(error);
    const eventName =
      providerError.error_code === "TIMEOUT"
        ? "song_generate_timeout"
        : "song_generate_failed";

    if (
      currentUserId &&
      currentSong &&
      providerError.error_code === ERROR_CODES.PROVIDER_4XX
    ) {
      await supabase
        .from("songs")
        .update({
          status: "failed",
          audio_provider_status: providerError.provider_error_code ?? "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentSong.id)
        .eq("user_id", currentUserId);
      await refundAudioGenerationCredit({
        supabase,
        userId: currentUserId,
        requestId,
        songId: currentSong.id,
        creditCost: getAudioProviderByName(currentSong.audio_provider)
          .creditCost,
        description: "audio_generation_refund",
        metadata: { operation: "audio_generation" },
      });
    }

    logError(eventName, {
      request_id: requestId,
      user_id: currentUserId,
      song_id: currentSong?.id ?? null,
      stage: "audio_poll",
      status: "failed",
      duration_ms: elapsedMs(startMs),
      error_code: providerError.error_code,
      provider_error_code: providerError.provider_error_code,
      provider_message: providerError.provider_message,
      provider_task_id: currentSong?.audio_provider_task_id,
      ...client,
    });

    if (currentSong && providerError.error_code === ERROR_CODES.PROVIDER_4XX) {
      return NextResponse.json({
        status: "failed",
        songId: currentSong.id,
        errorMessage: "Song generation failed. Please try again.",
      });
    }

    return NextResponse.json(
      { error: "Failed to check audio status", request_id: requestId },
      { status: 500 },
    );
  }
}
