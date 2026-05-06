import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audioProvider } from "@/lib/audio";
import { uploadPollinationsCover, uploadRemoteMedia } from "@/lib/audio/storage";
import { createClient } from "@/utils/supabase/server";

const AUDIO_CREDIT_COST = 100;

const querySchema = z.object({
  taskId: z.string().min(1).optional(),
  songId: z.string().uuid().optional(),
});

async function refundCreditIfNeeded(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  if (process.env.SKIP_CREDIT_CHECK === "true") {
    return;
  }

  await supabase.rpc("unfreeze_credit", {
    p_user_id: userId,
    p_amount: AUDIO_CREDIT_COST,
  });
}

export async function GET(request: NextRequest) {
  try {
    const query = querySchema.safeParse({
      taskId: request.nextUrl.searchParams.get("taskId") ?? undefined,
      songId: request.nextUrl.searchParams.get("songId") ?? undefined,
    });

    if (!query.success || (!query.data.taskId && !query.data.songId)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let songQuery = supabase
      .from("songs")
      .select(
        "id,title,status,kie_task_id,audio_url,audio_url_alt,cover_url,style_tags,user_id",
      )
      .eq("user_id", user.id);

    songQuery = query.data.songId
      ? songQuery.eq("id", query.data.songId)
      : songQuery.eq("kie_task_id", query.data.taskId);

    const { data: song, error: songError } = await songQuery.single();

    if (songError || !song || !song.kie_task_id) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    if (song.status === "ready") {
      return NextResponse.json({
        status: "completed",
        songId: song.id,
        audio_url: song.audio_url,
        audio_url_alt: song.audio_url_alt,
        cover_url: song.cover_url,
      });
    }

    if (song.status === "failed") {
      return NextResponse.json({ status: "failed", songId: song.id });
    }

    const result = await audioProvider.getTaskStatus(song.kie_task_id);

    if (result.status === "processing") {
      return NextResponse.json({ status: "processing", songId: song.id });
    }

    if (result.status === "failed" || result.songs.length === 0) {
      await supabase
        .from("songs")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", song.id)
        .eq("user_id", user.id);
      await refundCreditIfNeeded(supabase, user.id);

      return NextResponse.json({
        status: "failed",
        songId: song.id,
        error: result.error,
      });
    }

    const primary = result.songs[0];
    const alt = result.songs[1];
    const pathPrefix = `songs/${song.id}/audio`;
    const [audioUrl, audioUrlAlt] = await Promise.all([
      uploadRemoteMedia({
        url: primary.audio_url,
        pathPrefix,
        fileName: "primary",
        fallbackExtension: "mp3",
      }),
      alt
        ? uploadRemoteMedia({
            url: alt.audio_url,
            pathPrefix,
            fileName: "alt",
            fallbackExtension: "mp3",
          })
        : Promise.resolve(null),
    ]);

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

    const { error: updateError } = await supabase
      .from("songs")
      .update({
        audio_url: audioUrl,
        audio_url_alt: audioUrlAlt,
        cover_url: coverUrl,
        status: "ready",
        selected_audio: "primary",
        updated_at: new Date().toISOString(),
      })
      .eq("id", song.id)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      status: "completed",
      songId: song.id,
      audio_url: audioUrl,
      audio_url_alt: audioUrlAlt,
      cover_url: coverUrl,
    });
  } catch (error) {
    console.error("Audio status error:", error);
    return NextResponse.json(
      { error: "Failed to check audio status" },
      { status: 500 },
    );
  }
}
