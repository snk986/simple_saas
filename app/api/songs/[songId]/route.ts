import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { validationError } from "@/lib/api/errors";
import { finalizeAudioGeneration } from "@/lib/audio/finalize-generation";
import { getRequestId } from "@/lib/observability/log";

interface RouteContext {
  params: Promise<{ songId: string }>;
}

type SongStatus = "generating" | "completed" | "failed";
type SongStatusPayload = {
  status?: SongStatus;
  audioUrl?: string | null;
  coverUrl?: string | null;
  altSongId?: string | null;
  altAudioUrl?: string | null;
  altCoverUrl?: string | null;
  errorMessage?: string | null;
};

const songIdSchema = z.string().uuid();

function normalizeStatus(status: string): SongStatus {
  if (status === "ready") return "completed";
  if (status === "failed") return "failed";
  return "generating";
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { songId } = await context.params;
  const parsedSongId = songIdSchema.safeParse(songId);

  if (!parsedSongId.success) {
    return validationError(parsedSongId.error);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: song, error } = await supabase
    .from("songs")
    .select(
      "id,title,lyrics,user_input,style_key,style_params,style_tags,status,audio_url,cover_url,audio_url_alt",
    )
    .eq("id", parsedSongId.data)
    .eq("user_id", user.id)
    .single();

  if (error || !song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  let statusPayload: SongStatusPayload | null = null;

  if (song.status === "generating") {
    const finalizerResult = await finalizeAudioGeneration({
      songId: parsedSongId.data,
      requestId: getRequestId(request.headers.get("x-request-id")),
      source: "poll",
      userId: user.id,
    });

    if (finalizerResult.status !== "not_found") {
      statusPayload = {
        status: finalizerResult.status,
        audioUrl:
          finalizerResult.status === "completed"
            ? finalizerResult.audioUrl
            : null,
        coverUrl:
          finalizerResult.status === "completed"
            ? finalizerResult.coverUrl
            : null,
        altSongId:
          finalizerResult.status === "completed"
            ? (finalizerResult.altSongId ?? null)
            : null,
        altAudioUrl:
          finalizerResult.status === "completed"
            ? (finalizerResult.altAudioUrl ?? null)
            : null,
        altCoverUrl:
          finalizerResult.status === "completed"
            ? (finalizerResult.altCoverUrl ?? null)
            : null,
        errorMessage:
          finalizerResult.status === "failed"
            ? finalizerResult.errorMessage
            : null,
      };
    }
  }

  const status = statusPayload?.status ?? normalizeStatus(song.status);
  const errorMessage =
    status === "failed"
      ? (statusPayload?.errorMessage ??
        "Song generation failed. Please try again.")
      : null;
  const audioUrl =
    status === "completed" ? (statusPayload?.audioUrl ?? song.audio_url) : null;
  const coverUrl =
    status === "completed" ? (statusPayload?.coverUrl ?? song.cover_url) : null;
  const altAudioUrl =
    status === "completed"
      ? (statusPayload?.altAudioUrl ?? song.audio_url_alt)
      : null;
  const altCoverUrl =
    status === "completed" ? (statusPayload?.altCoverUrl ?? null) : null;

  return NextResponse.json({
    songId: song.id,
    status,
    title: song.title,
    lyrics: song.lyrics,
    userInput: song.user_input,
    styleKey: song.style_key,
    styleParams: song.style_params,
    styleTags: song.style_tags ?? [],
    audioUrl,
    coverUrl,
    errorMessage,
    altSongId:
      status === "completed" ? (statusPayload?.altSongId ?? null) : null,
    altAudioUrl,
    altCoverUrl,
  });
}
