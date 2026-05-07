import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { audioProvider } from "@/lib/audio";
import { getSongStyle } from "@/config/styles";
import { createClient } from "@/utils/supabase/server";
import {
  getSongExpiryForEntitlements,
  getUserEntitlements,
} from "@/lib/subscription/entitlements";

const AUDIO_CREDIT_COST = 100;

const requestSchema = z.object({
  songId: z.string().uuid(),
  lyrics: z.string().trim().min(20).max(10000).optional(),
});

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function freezeCreditIfNeeded(supabase: SupabaseClient, userId: string) {
  if (process.env.SKIP_CREDIT_CHECK === "true") {
    return { enough: true, charged: false };
  }

  const { data, error } = await supabase.rpc("freeze_credit", {
    p_user_id: userId,
    p_amount: AUDIO_CREDIT_COST,
    p_description: "audio_generation",
    p_metadata: { operation: "audio_generation" },
  });

  if (error) {
    throw error;
  }

  const enough = Boolean((data as { enough?: boolean } | null)?.enough);
  return { enough, charged: enough };
}

async function refundCreditIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  charged: boolean,
) {
  if (!charged || process.env.SKIP_CREDIT_CHECK === "true") {
    return;
  }

  await supabase.rpc("unfreeze_credit", {
    p_user_id: userId,
    p_amount: AUDIO_CREDIT_COST,
    p_description: "audio_generation_refund",
    p_metadata: { operation: "audio_generation" },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  let charged = false;
  let userId: string | null = null;

  try {
    const body = requestSchema.safeParse(await request.json());

    if (!body.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = user.id;
    const entitlements = await getUserEntitlements(user.id);
    const { data: song, error: songError } = await supabase
      .from("songs")
      .select("id,title,lyrics,style_key,user_id,status,expires_at")
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

    const credit = await freezeCreditIfNeeded(supabase, user.id);
    charged = credit.charged;

    if (!credit.enough) {
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
        expires_at: entitlements.canKeepSongsForever
          ? null
          : song.expires_at ?? getSongExpiryForEntitlements(entitlements),
        updated_at: new Date().toISOString(),
      })
      .eq("id", song.id)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    charged = false;
    return NextResponse.json({ taskId, songId: song.id });
  } catch (error) {
    if (userId) {
      await refundCreditIfNeeded(supabase, userId, charged);
    }

    console.error("Audio generation error:", error);
    return NextResponse.json(
      { error: "Audio generation failed" },
      { status: 500 },
    );
  }
}
