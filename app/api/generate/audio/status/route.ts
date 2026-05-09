import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audioProvider } from "@/lib/audio";
import {
  uploadPollinationsCover,
  uploadRemoteMedia,
} from "@/lib/audio/storage";
import { checkAchievements } from "@/lib/achievements/check-achievements";
import { getUserEntitlements } from "@/lib/subscription/entitlements";
import { createClient } from "@/utils/supabase/server";

const AUDIO_CREDIT_COST = 200;

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
    p_description: "audio_generation_refund",
    p_metadata: { operation: "audio_generation" },
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
        "id,title,lyrics,user_input,status,kie_task_id,audio_url,audio_url_alt,cover_url,lyrics_regen_count,style_key,style_params,style_tags,locale,user_id,is_public,expires_at,created_at",
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
        cover_url: song.cover_url,
      });
    }

    if (song.status === "failed") {
      return NextResponse.json({ status: "failed", songId: song.id });
    }

    const entitlements = await getUserEntitlements(user.id);
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
      console.error("Achievement check error:", achievementError);
    });

    return NextResponse.json({
      status: "completed",
      songId: song.id,
      audio_url: audioUrl,
      cover_url: coverUrl,
      altSongId: altSong?.id,
      alt_audio_url: altSong?.audio_url,
      alt_cover_url: altSong?.cover_url,
    });
  } catch (error) {
    console.error("Audio status error:", error);
    return NextResponse.json(
      { error: "Failed to check audio status" },
      { status: 500 },
    );
  }
}
