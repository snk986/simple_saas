import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { jobId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statusResponse = await fetch(
    `${request.nextUrl.origin}/api/generate/audio/status?songId=${encodeURIComponent(jobId)}`,
    {
      method: "GET",
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    },
  );

  let statusPayload: Record<string, unknown> | null = null;
  if (statusResponse.ok) {
    statusPayload = (await statusResponse.json()) as Record<string, unknown>;
  }

  const { data: song, error } = await supabase
    .from("songs")
    .select(
      "id,title,lyrics,user_input,style_key,style_params,style_tags,status,audio_provider_task_id,audio_url,cover_url,audio_url_alt",
    )
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();

  if (error || !song) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const normalizedStatus =
    song.status === "ready"
      ? "completed"
      : song.status === "failed"
        ? "failed"
        : song.status === "generating"
          ? "processing"
          : "idle";

  return NextResponse.json({
    jobId: song.id,
    songId: song.id,
    taskId: song.audio_provider_task_id,
    status:
      (statusPayload?.status as string | undefined) ??
      normalizedStatus,
    title: song.title,
    lyrics: song.lyrics,
    userInput: song.user_input,
    style_key: song.style_key,
    style_params: song.style_params,
    style_tags: song.style_tags ?? [],
    audio_url:
      (statusPayload?.audio_url as string | undefined) ?? song.audio_url,
    cover_url:
      (statusPayload?.cover_url as string | undefined) ?? song.cover_url,
    altSongId: (statusPayload?.altSongId as string | undefined) ?? null,
    alt_audio_url:
      (statusPayload?.alt_audio_url as string | undefined) ??
      song.audio_url_alt,
    alt_cover_url:
      (statusPayload?.alt_cover_url as string | undefined) ?? null,
  });
}

