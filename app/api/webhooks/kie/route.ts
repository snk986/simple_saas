import { NextRequest, NextResponse } from "next/server";
import { ERROR_CODES } from "@/lib/observability/error-codes";
import { getRequestId, logError, logInfo } from "@/lib/observability/log";

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request.headers.get("x-request-id"));
  try {
    const payload = await request.json();
    const eventId =
      payload?.event_id ?? payload?.id ?? payload?.data?.eventId ?? null;
    const providerTaskId = payload?.data?.taskId ?? payload?.taskId ?? null;
    const status = payload?.data?.status ?? payload?.status ?? null;

    logInfo("webhook_received", {
      request_id: requestId,
      stage: "webhook_received",
      status: "received",
      event_id: eventId,
      provider_task_id: providerTaskId,
      signature_ok: null,
      idempotent_hit: false,
      retry_count: 0,
    });

    logInfo("webhook_processed", {
      request_id: requestId,
      stage: "webhook_processed",
      status: "succeeded",
      event_id: eventId,
      provider_task_id: providerTaskId,
      processed_ok: true,
      provider_status: status,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    logError("webhook_failed", {
      request_id: requestId,
      stage: "webhook_processed",
      status: "failed",
      error_code: ERROR_CODES.WEBHOOK_FAILED,
      failure_reason: error instanceof Error ? error.message : String(error),
      processed_ok: false,
      retry_count: 0,
    });
    return NextResponse.json({ received: true });
  }
}
