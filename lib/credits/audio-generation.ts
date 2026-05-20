import type { SupabaseClient } from "@supabase/supabase-js";
import { ERROR_CODES } from "@/lib/observability/error-codes";
import { logError, logInfo } from "@/lib/observability/log";

type AudioCreditSupabaseClient = SupabaseClient;

type CreditMetadata = Record<string, unknown>;

interface BaseAudioCreditInput {
  supabase: AudioCreditSupabaseClient;
  userId: string;
  requestId: string;
  songId?: string | null;
  creditCost: number;
  description: string;
  metadata?: CreditMetadata;
}

interface RefundAudioCreditInput extends BaseAudioCreditInput {
  stage?: string;
}

async function getCreditBalance(
  supabase: AudioCreditSupabaseClient,
  userId: string,
) {
  const { data } = await supabase
    .from("customers")
    .select("credits_balance")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.credits_balance ?? null;
}

function buildMetadata(input: BaseAudioCreditInput) {
  return {
    ...input.metadata,
    request_id: input.requestId,
    song_id: input.songId ?? null,
  };
}

export async function freezeAudioGenerationCredit(
  input: BaseAudioCreditInput,
) {
  if (process.env.SKIP_CREDIT_CHECK === "true") {
    return { enough: true, charged: false };
  }

  const before = await getCreditBalance(input.supabase, input.userId);
  const { data, error } = await input.supabase.rpc("freeze_credit", {
    p_user_id: input.userId,
    p_amount: input.creditCost,
    p_description: input.description,
    p_metadata: buildMetadata(input),
  });

  if (error) {
    logError("credit_freeze", {
      request_id: input.requestId,
      user_id: input.userId,
      song_id: input.songId ?? null,
      op: "freeze",
      stage: "credit_finalize",
      status: "failed",
      error_code: ERROR_CODES.CREDIT_OP_FAILED,
      failure_reason: error.message,
      balance_before: before,
      amount: input.creditCost,
      balance_after: null,
      success: false,
    });
    throw error;
  }

  const enough = Boolean((data as { enough?: boolean } | null)?.enough);
  const after = await getCreditBalance(input.supabase, input.userId);

  logInfo("credit_freeze", {
    request_id: input.requestId,
    user_id: input.userId,
    song_id: input.songId ?? null,
    op: "freeze",
    stage: "credit_finalize",
    status: enough ? "succeeded" : "insufficient",
    balance_before: before,
    amount: input.creditCost,
    balance_after: after,
    success: enough,
  });

  return { enough, charged: enough };
}

export async function refundAudioGenerationCredit(
  input: RefundAudioCreditInput,
) {
  if (process.env.SKIP_CREDIT_CHECK === "true") {
    return;
  }

  const stage = input.stage ?? "credit_finalize";
  const before = await getCreditBalance(input.supabase, input.userId);
  const { error } = await input.supabase.rpc("unfreeze_credit", {
    p_user_id: input.userId,
    p_amount: input.creditCost,
    p_description: input.description,
    p_metadata: buildMetadata(input),
  });

  if (error) {
    logError("credit_refund", {
      request_id: input.requestId,
      user_id: input.userId,
      song_id: input.songId ?? null,
      op: "refund",
      stage,
      status: "failed",
      error_code: ERROR_CODES.CREDIT_OP_FAILED,
      failure_reason: error.message,
      balance_before: before,
      amount: input.creditCost,
      balance_after: null,
      success: false,
    });
    return;
  }

  const after = await getCreditBalance(input.supabase, input.userId);

  logInfo("credit_refund", {
    request_id: input.requestId,
    user_id: input.userId,
    song_id: input.songId ?? null,
    op: "refund",
    stage,
    status: "succeeded",
    balance_before: before,
    amount: input.creditCost,
    balance_after: after,
    success: true,
  });
}
