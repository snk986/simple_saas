import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkAchievements } from "@/lib/achievements/check-achievements";
import { generateJudgeReport } from "@/lib/ai/provider";
import { getUserEntitlements } from "@/lib/subscription/entitlements";
import { createClient } from "@/utils/supabase/server";
import type { JudgeReport } from "@/types/judge";
import { ERROR_CODES } from "@/lib/observability/error-codes";
import {
  classifyProviderError,
  elapsedMs,
  getRequestId,
  logError,
  logInfo,
} from "@/lib/observability/log";
import { invalidJsonRequest, validationError } from "@/lib/api/errors";

const REPORT_CREDIT_COST = 100;

const requestSchema = z.object({
  songId: z.string().uuid(),
});

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function getCreditBalance(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("customers")
    .select("credits_balance")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.credits_balance ?? null;
}

async function freezeCreditIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  requestId: string,
  songId: string,
) {
  if (process.env.SKIP_CREDIT_CHECK === "true") {
    return { enough: true, charged: false };
  }

  const before = await getCreditBalance(supabase, userId);
  const { data, error } = await supabase.rpc("freeze_credit", {
    p_user_id: userId,
    p_amount: REPORT_CREDIT_COST,
    p_description: "judge_report",
    p_metadata: {
      operation: "judge_report",
      request_id: requestId,
      song_id: songId,
    },
  });

  if (error) {
    logError("credit_freeze", {
      request_id: requestId,
      user_id: userId,
      song_id: songId,
      op: "freeze",
      stage: "credit_finalize",
      status: "failed",
      error_code: ERROR_CODES.CREDIT_OP_FAILED,
      failure_reason: error.message,
      balance_before: before,
      amount: REPORT_CREDIT_COST,
      balance_after: null,
      success: false,
    });
    throw error;
  }

  const enough = Boolean((data as { enough?: boolean } | null)?.enough);
  const after = await getCreditBalance(supabase, userId);
  logInfo("credit_freeze", {
    request_id: requestId,
    user_id: userId,
    song_id: songId,
    op: "freeze",
    stage: "credit_finalize",
    status: enough ? "succeeded" : "insufficient",
    balance_before: before,
    amount: REPORT_CREDIT_COST,
    balance_after: after,
    success: enough,
  });

  return { enough, charged: enough };
}

async function refundCreditIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  charged: boolean,
  requestId: string,
  songId: string | null,
) {
  if (!charged || process.env.SKIP_CREDIT_CHECK === "true") {
    return;
  }

  const before = await getCreditBalance(supabase, userId);
  const { error } = await supabase.rpc("unfreeze_credit", {
    p_user_id: userId,
    p_amount: REPORT_CREDIT_COST,
    p_description: "judge_report_refund",
    p_metadata: {
      operation: "judge_report",
      request_id: requestId,
      song_id: songId,
    },
  });

  if (error) {
    logError("credit_refund", {
      request_id: requestId,
      user_id: userId,
      song_id: songId,
      op: "refund",
      stage: "credit_finalize",
      status: "failed",
      error_code: ERROR_CODES.CREDIT_OP_FAILED,
      failure_reason: error.message,
      balance_before: before,
      amount: REPORT_CREDIT_COST,
      balance_after: null,
      success: false,
    });
    return;
  }

  const after = await getCreditBalance(supabase, userId);
  logInfo("credit_refund", {
    request_id: requestId,
    user_id: userId,
    song_id: songId,
    op: "refund",
    stage: "credit_finalize",
    status: "succeeded",
    balance_before: before,
    amount: REPORT_CREDIT_COST,
    balance_after: after,
    success: true,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const requestId = getRequestId(request.headers.get("x-request-id"));
  const startMs = Date.now();
  let charged = false;
  let userId: string | null = null;
  let songId: string | null = null;

  try {
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return invalidJsonRequest();
    }

    const body = requestSchema.safeParse(payload);

    if (!body.success) {
      return validationError(body.error);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = user.id;
    songId = body.data.songId;
    await getUserEntitlements(user.id);
    logInfo("report_start", {
      request_id: requestId,
      user_id: user.id,
      song_id: songId,
      stage: "report_generation",
      status: "started",
    });

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

    const credit = await freezeCreditIfNeeded(
      supabase,
      user.id,
      requestId,
      song.id,
    );
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
    logInfo("report_end", {
      request_id: requestId,
      user_id: user.id,
      song_id: song.id,
      stage: "report_generation",
      status: "succeeded",
      duration_ms: elapsedMs(startMs),
    });

    await checkAchievements(user.id).catch((achievementError) => {
      console.error("Achievement check error:", achievementError);
    });

    return NextResponse.json({
      request_id: requestId,
      songId: updatedSong.id,
      report: updatedSong.report_data as JudgeReport,
    });
  } catch (error) {
    if (userId) {
      await refundCreditIfNeeded(supabase, userId, charged, requestId, songId);
    }

    const providerError = classifyProviderError(error);
    logError("report_failed", {
      request_id: requestId,
      user_id: userId,
      song_id: songId,
      stage: "report_generation",
      status: "failed",
      duration_ms: elapsedMs(startMs),
      error_code: providerError.error_code,
      provider_error_code: providerError.provider_error_code,
      provider_message: providerError.provider_message,
    });
    return NextResponse.json(
      { error: "Report generation failed", request_id: requestId },
      { status: 500 },
    );
  }
}
