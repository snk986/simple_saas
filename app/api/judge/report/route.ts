import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkAchievements } from "@/lib/achievements/check-achievements";
import { generateJudgeReport } from "@/lib/ai/claude";
import { getUserEntitlements } from "@/lib/subscription/entitlements";
import { createClient } from "@/utils/supabase/server";
import type { JudgeReport } from "@/types/judge";

const REPORT_CREDIT_COST = 100;

const requestSchema = z.object({
  songId: z.string().uuid(),
});

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function freezeCreditIfNeeded(supabase: SupabaseClient, userId: string) {
  if (process.env.SKIP_CREDIT_CHECK === "true") {
    return { enough: true, charged: false };
  }

  const { data, error } = await supabase.rpc("freeze_credit", {
    p_user_id: userId,
    p_amount: REPORT_CREDIT_COST,
    p_description: "judge_report",
    p_metadata: { operation: "judge_report" },
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
    p_amount: REPORT_CREDIT_COST,
    p_description: "judge_report_refund",
    p_metadata: { operation: "judge_report" },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  let charged = false;
  let userId: string | null = null;

  try {
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const body = requestSchema.safeParse(payload);

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
    await getUserEntitlements(user.id);

    const { data: song, error: songError } = await supabase
      .from("songs")
      .select(
        "id,title,lyrics,user_input,style_params,style_tags,locale,status,report_data,total_score,user_id",
      )
      .eq("id", body.data.songId)
      .eq("user_id", user.id)
      .single();

    if (songError || !song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    if (song.status !== "ready") {
      return NextResponse.json({ error: "Song is not ready" }, { status: 400 });
    }

    if (song.report_data) {
      return NextResponse.json({
        songId: song.id,
        report: song.report_data as JudgeReport,
      });
    }

    const credit = await freezeCreditIfNeeded(supabase, user.id);
    charged = credit.charged;

    if (!credit.enough) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 },
      );
    }

    const report = await generateJudgeReport({
      title: song.title,
      lyrics: song.lyrics,
      userInput: song.user_input,
      styleParams: (song.style_params ?? {}) as Record<string, unknown>,
      styleTags: Array.isArray(song.style_tags) ? song.style_tags : [],
      locale: song.locale ?? "en",
    });

    const { data: updatedSong, error: updateError } = await supabase
      .from("songs")
      .update({
        report_data: report,
        total_score: report.total_score,
        updated_at: new Date().toISOString(),
      })
      .eq("id", song.id)
      .eq("user_id", user.id)
      .select("id,report_data")
      .single();

    if (updateError || !updatedSong) {
      throw updateError ?? new Error("Failed to store judge report");
    }

    charged = false;

    await checkAchievements(user.id).catch((achievementError) => {
      console.error("Achievement check error:", achievementError);
    });

    return NextResponse.json({
      songId: updatedSong.id,
      report: updatedSong.report_data as JudgeReport,
    });
  } catch (error) {
    if (userId) {
      await refundCreditIfNeeded(supabase, userId, charged);
    }

    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Report generation failed" },
      { status: 500 },
    );
  }
}
