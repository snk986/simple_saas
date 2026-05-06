import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audioProvider } from "@/lib/audio";
import { getSongStyle } from "@/config/styles";
import { createClient } from "@/utils/supabase/server";

const AUDIO_CREDIT_COST = 100;

const requestSchema = z.object({
  songId: z.string().uuid(),
  lyrics: z.string().trim().min(20).max(10000).optional(),
});

async function freezeCreditIfNeeded(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  if (process.env.SKIP_CREDIT_CHECK === "true") {
    return true;
  }

  const { data, error } = await supabase.rpc("freeze_credit", {
    p_user_id: userId,
    p_amount: AUDIO_CREDIT_COST,
  });

  if (error) {
    throw error;
  }

  return Boolean((data as { enough?: boolean } | null)?.enough);
}

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.safeParse(await request.json());

    if (!body.success) {
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

    const { data: song, error: songError } = await supabase
      .from("songs")
      .select("id,title,lyrics,style_key,user_id,status")
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

    const hasCredit = await freezeCreditIfNeeded(supabase, user.id);

    if (!hasCredit) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    const lyrics = body.data.lyrics ?? song.lyrics;
    const style = getSongStyle(song.style_key);
    const { taskId } = await audioProvider.generateSong({
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
        kie_task_id: taskId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", song.id)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ taskId, songId: song.id });
  } catch (error) {
    console.error("Audio generation error:", error);
    return NextResponse.json(
      { error: "Audio generation failed" },
      { status: 500 },
    );
  }
}
