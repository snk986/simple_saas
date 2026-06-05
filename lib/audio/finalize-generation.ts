import { checkAchievements } from "@/lib/achievements/check-achievements";
import { getAudioProviderByName } from "@/lib/audio";
import {
  getDefaultCoverUrl,
  uploadPollinationsCover,
  uploadRemoteMedia,
} from "@/lib/audio/storage";
import type { TaskResult } from "@/lib/audio/types";
import { refundAudioGenerationCredit } from "@/lib/credits/audio-generation";
import { ERROR_CODES } from "@/lib/observability/error-codes";
import {
  classifyProviderError,
  logError,
  logInfo,
} from "@/lib/observability/log";
import { getUserEntitlements } from "@/lib/subscription/entitlements";
import { trackServerUserEvent } from "@/lib/analytics/user-events-server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

const SUBMITTING_GRACE_MS = 3 * 60 * 1000;
const FINALIZING_STALE_MS = 15 * 60 * 1000;

type FinalizerSource = "poll" | "webhook" | "cron";

type SongRow = {
  id: string;
  title: string;
  lyrics: string;
  user_input: string | null;
  status: "generating" | "ready" | "failed" | "expired";
  audio_provider: string;
  audio_provider_task_id: string | null;
  audio_provider_status: string | null;
  audio_url: string | null;
  audio_url_alt: string | null;
  cover_url: string | null;
  lyrics_regen_count: number | null;
  style_key: string | null;
  style_params: unknown;
  style_tags: string[] | null;
  locale: string | null;
  user_id: string;
  is_public: boolean | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string | null;
};

export type FinalizeAudioGenerationResult =
  | {
      status: "not_found";
    }
  | {
      status: "generating";
      songId: string;
      providerStatus?: string | null;
      errorMessage: null;
    }
  | {
      status: "completed";
      songId: string;
      audioUrl: string | null;
      coverUrl: string | null;
      altSongId?: string;
      altAudioUrl?: string | null;
      altCoverUrl?: string | null;
      errorMessage: null;
    }
  | {
      status: "failed";
      songId: string;
      errorMessage: string;
    };

interface FinalizeAudioGenerationInput {
  songId: string;
  requestId: string;
  source: FinalizerSource;
  userId?: string | null;
}

function isRecentSubmittingWithoutTask(song: SongRow) {
  return (
    !song.audio_provider_task_id &&
    song.audio_provider_status === "submitting" &&
    Date.now() - new Date(song.created_at).getTime() < SUBMITTING_GRACE_MS
  );
}

function isFinalizingStale(song: Pick<SongRow, "updated_at">) {
  if (!song.updated_at) {
    return true;
  }

  return Date.now() - new Date(song.updated_at).getTime() > FINALIZING_STALE_MS;
}

function isUnrecoverableProviderError(errorCode: string) {
  return errorCode === ERROR_CODES.PROVIDER_4XX;
}

function mapStoredSong(song: SongRow): FinalizeAudioGenerationResult {
  if (song.status === "ready") {
    return {
      status: "completed",
      songId: song.id,
      audioUrl: song.audio_url,
      coverUrl: song.cover_url,
      errorMessage: null,
    };
  }

  if (song.status === "failed" || song.status === "expired") {
    return {
      status: "failed",
      songId: song.id,
      errorMessage: "Song generation failed. Please try again.",
    };
  }

  return {
    status: "generating",
    songId: song.id,
    providerStatus: song.audio_provider_status,
    errorMessage: null,
  };
}

async function fetchSong(input: FinalizeAudioGenerationInput) {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from("songs")
    .select(
      "id,title,lyrics,user_input,status,audio_provider,audio_provider_task_id,audio_provider_status,audio_url,audio_url_alt,cover_url,lyrics_regen_count,style_key,style_params,style_tags,locale,user_id,is_public,expires_at,created_at,updated_at",
    )
    .eq("id", input.songId);

  if (input.userId) {
    query = query.eq("user_id", input.userId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return (data as SongRow | null) ?? null;
}

async function lockForFinalSideEffects(song: SongRow) {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from("songs")
    .update({
      audio_provider_status: "finalizing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", song.id)
    .eq("status", "generating")
    .select(
      "id,title,lyrics,user_input,status,audio_provider,audio_provider_task_id,audio_provider_status,audio_url,audio_url_alt,cover_url,lyrics_regen_count,style_key,style_params,style_tags,locale,user_id,is_public,expires_at,created_at,updated_at",
    );

  if (song.audio_provider_status === "finalizing") {
    if (!isFinalizingStale(song)) {
      return null;
    }

    query = query.lt(
      "updated_at",
      new Date(Date.now() - FINALIZING_STALE_MS).toISOString(),
    );
  } else {
    query = query.or(
      "audio_provider_status.is.null,audio_provider_status.neq.finalizing",
    );
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return (data as SongRow | null) ?? null;
}

async function markMissingTaskIdFailed(
  song: SongRow,
  requestId: string,
  source: FinalizerSource,
) {
  const provider = getAudioProviderByName(song.audio_provider);
  const supabase = createServiceRoleClient();
  const { data: updatedSong, error } = await supabase
    .from("songs")
    .update({
      status: "failed",
      audio_provider_status: "missing_provider_request_id",
      updated_at: new Date().toISOString(),
    })
    .eq("id", song.id)
    .eq("status", "generating")
    .eq("audio_provider_status", "finalizing")
    .select("id,user_id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (updatedSong) {
    await refundAudioGenerationCredit({
      supabase,
      userId: updatedSong.user_id,
      requestId,
      songId: updatedSong.id,
      creditCost: provider.creditCost,
      description: "audio_generation_refund",
      metadata: { operation: "audio_generation", source },
      stage: "audio_finalize",
    });

    await trackServerUserEvent({
      userId: updatedSong.user_id,
      eventName: "generate_audio_failed",
      properties: {
        provider: song.audio_provider,
        provider_status: "missing_provider_request_id",
        route: `/finalizer/${source}`,
        song_id: song.id,
        status: "failed",
      },
      pathname: `/finalizer/${source}`,
    });
  }

  return {
    status: "failed" as const,
    songId: song.id,
    errorMessage: "Song generation failed. Please try again.",
  };
}

async function markProviderFailed(
  song: SongRow,
  result: TaskResult,
  requestId: string,
  source: FinalizerSource,
) {
  const provider = getAudioProviderByName(song.audio_provider);
  const supabase = createServiceRoleClient();
  const providerStatus = result.providerStatus ?? "failed";
  const { data: updatedSong, error } = await supabase
    .from("songs")
    .update({
      status: "failed",
      audio_provider_status: providerStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", song.id)
    .eq("status", "generating")
    .eq("audio_provider_status", "finalizing")
    .select("id,user_id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (updatedSong) {
    await refundAudioGenerationCredit({
      supabase,
      userId: updatedSong.user_id,
      requestId,
      songId: updatedSong.id,
      creditCost: provider.creditCost,
      description: "audio_generation_refund",
      metadata: { operation: "audio_generation", source },
      stage: "audio_finalize",
    });

    await trackServerUserEvent({
      userId: updatedSong.user_id,
      eventName: "generate_audio_failed",
      properties: {
        locale: song.locale,
        provider: song.audio_provider,
        provider_status: providerStatus,
        route: `/finalizer/${source}`,
        song_id: song.id,
        status: "failed",
        style_key: song.style_key,
      },
      pathname: `/finalizer/${source}`,
    });
  }

  logError("song_generate_failed", {
    request_id: requestId,
    user_id: song.user_id,
    song_id: song.id,
    stage: "audio_finalize",
    status: "failed",
    error_code: ERROR_CODES.TIMEOUT,
    failure_reason: result.error ?? "provider returned failed",
    provider_task_id: song.audio_provider_task_id,
    provider_status: providerStatus,
    source,
  });

  return {
    status: "failed" as const,
    songId: song.id,
    errorMessage: result.error ?? "Song generation failed. Please try again.",
  };
}

async function markProviderCompleted(
  song: SongRow,
  result: TaskResult,
  requestId: string,
  source: FinalizerSource,
) {
  const supabase = createServiceRoleClient();
  const entitlements = await getUserEntitlements(song.user_id);
  const primary = result.songs[0];
  const alt = result.songs[1];
  const audioUrl = await uploadRemoteMedia({
    url: primary.audio_url,
    pathPrefix: `songs/${song.id}/audio`,
    fileName: "primary",
    fallbackExtension: "mp3",
  });
  let coverUrl: string | null = null;

  try {
    coverUrl = primary.image_url
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
  } catch (coverError) {
    coverUrl = getDefaultCoverUrl();
    logError("song_cover_upload_failed", {
      request_id: requestId,
      user_id: song.user_id,
      song_id: song.id,
      stage: "audio_finalize",
      status: "failed",
      error_code: ERROR_CODES.BAD_RESPONSE,
      failure_reason:
        coverError instanceof Error ? coverError.message : String(coverError),
      source,
    });
  }

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

  const { data: readySong, error: updateError } = await supabase
    .from("songs")
    .update(readyUpdate)
    .eq("id", song.id)
    .eq("status", "generating")
    .eq("audio_provider_status", "finalizing")
    .select("id,user_id")
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  if (!readySong) {
    const latest = await fetchSong({
      songId: song.id,
      requestId,
      source,
      userId: song.user_id,
    });
    return latest ? mapStoredSong(latest) : { status: "not_found" as const };
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
        user_id: song.user_id,
        title: altTitle === song.title ? `${song.title} (Version B)` : altTitle,
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
      .eq("user_id", song.user_id)
      .select("id,audio_url,cover_url")
      .single();

    if (updateAltError || !readyAltSong) {
      throw updateAltError ?? new Error("Failed to store alternate song");
    }

    altSong = readyAltSong;
  }

  await checkAchievements(song.user_id).catch((achievementError) => {
    logError("achievement_check_failed", {
      request_id: requestId,
      user_id: song.user_id,
      song_id: song.id,
      stage: "audio_finalize",
      status: "failed",
      error_code: ERROR_CODES.BAD_RESPONSE,
      failure_reason:
        achievementError instanceof Error
          ? achievementError.message
          : String(achievementError),
      source,
    });
  });

  await trackServerUserEvent({
    userId: song.user_id,
    eventName: "generate_audio_completed",
    properties: {
      locale: song.locale,
      provider: song.audio_provider,
      provider_status: result.providerStatus ?? "completed",
      route: `/finalizer/${source}`,
      song_id: song.id,
      status: "completed",
      style_key: song.style_key,
    },
    pathname: `/finalizer/${source}`,
  });

  logInfo("song_generate_success", {
    request_id: requestId,
    user_id: song.user_id,
    song_id: song.id,
    stage: "audio_finalize",
    status: "succeeded",
    provider_task_id: song.audio_provider_task_id,
    source,
  });

  return {
    status: "completed" as const,
    songId: song.id,
    audioUrl,
    coverUrl,
    altSongId: altSong?.id,
    altAudioUrl: altSong?.audio_url,
    altCoverUrl: altSong?.cover_url,
    errorMessage: null,
  };
}

export async function finalizeAudioGeneration(
  input: FinalizeAudioGenerationInput,
): Promise<FinalizeAudioGenerationResult> {
  const song = await fetchSong(input);

  if (!song) {
    return { status: "not_found" };
  }

  if (song.status !== "generating") {
    return mapStoredSong(song);
  }

  if (!song.audio_provider_task_id) {
    if (isRecentSubmittingWithoutTask(song)) {
      return {
        status: "generating",
        songId: song.id,
        providerStatus: song.audio_provider_status,
        errorMessage: null,
      };
    }

    const lockedSong = await lockForFinalSideEffects(song);
    if (!lockedSong) {
      const latest = await fetchSong(input);
      return latest ? mapStoredSong(latest) : { status: "not_found" };
    }

    return markMissingTaskIdFailed(lockedSong, input.requestId, input.source);
  }

  const provider = getAudioProviderByName(song.audio_provider);
  let result: TaskResult;

  try {
    result = await provider.getTaskStatus(song.audio_provider_task_id);
  } catch (error) {
    const providerError = classifyProviderError(error);

    if (!isUnrecoverableProviderError(providerError.error_code)) {
      throw error;
    }

    const lockedSong = await lockForFinalSideEffects(song);
    if (!lockedSong) {
      const latest = await fetchSong(input);
      return latest ? mapStoredSong(latest) : { status: "not_found" };
    }

    return markProviderFailed(
      lockedSong,
      {
        status: "failed",
        songs: [],
        error: providerError.provider_message,
        providerStatus:
          providerError.provider_error_code ?? providerError.error_code,
      },
      input.requestId,
      input.source,
    );
  }

  if (result.status === "processing") {
    if (result.providerStatus) {
      const supabase = createServiceRoleClient();
      await supabase
        .from("songs")
        .update({
          audio_provider_status: result.providerStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", song.id)
        .eq("status", "generating");
    }

    return {
      status: "generating",
      songId: song.id,
      providerStatus: result.providerStatus,
      errorMessage: null,
    };
  }

  const lockedSong = await lockForFinalSideEffects(song);
  if (!lockedSong) {
    const latest = await fetchSong(input);
    return latest ? mapStoredSong(latest) : { status: "not_found" };
  }

  if (result.status === "failed" || result.songs.length === 0) {
    return markProviderFailed(
      lockedSong,
      result,
      input.requestId,
      input.source,
    );
  }

  return markProviderCompleted(
    lockedSong,
    result,
    input.requestId,
    input.source,
  );
}
