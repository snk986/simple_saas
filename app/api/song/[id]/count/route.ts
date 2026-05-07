import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkAchievements } from "@/lib/achievements/check-achievements";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

const requestSchema = z.object({
  event: z.enum(["play_start", "play_complete", "share", "cta_click"]),
});

const counterByEvent = {
  play_start: "play_count",
  play_complete: "complete_count",
  share: "share_count",
  cta_click: "cta_click_count",
} as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = requestSchema.safeParse(await request.json());

    if (!body.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data: song, error: fetchError } = await supabase
      .from("songs")
      .select("id,user_id")
      .eq("id", id)
      .eq("is_public", true)
      .eq("status", "ready")
      .single();

    if (fetchError || !song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    const { error } = await supabase.rpc("increment_song_counter", {
      p_song_id: id,
      p_counter: counterByEvent[body.data.event],
    });

    if (error) {
      throw error;
    }

    await checkAchievements(song.user_id).catch((achievementError) => {
      console.error("Achievement check error:", achievementError);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Song count error:", error);
    return NextResponse.json(
      { error: "Failed to count song event" },
      { status: 500 },
    );
  }
}
