import { createHash, createPublicKey, verify } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ERROR_CODES } from "@/lib/observability/error-codes";
import { falProvider } from "@/lib/audio/fal-provider";
import { refundAudioGenerationCredit } from "@/lib/credits/audio-generation";
import { getRequestId, logError, logInfo } from "@/lib/observability/log";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

const FAL_JWKS_URL =
  process.env.FAL_WEBHOOK_JWKS_URL ?? "https://rest.fal.ai/.well-known/jwks.json";
const MAX_TIMESTAMP_DRIFT_SECONDS = 300;
const JWKS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type JwksKey = { x?: string; kty?: string; crv?: string };

let jwksCache: { keys: JwksKey[]; expiresAt: number } | null = null;

function base64UrlToBuffer(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = padding === 0 ? normalized : normalized + "=".repeat(4 - padding);
  return Buffer.from(padded, "base64");
}

function buildEd25519SpkiKey(rawPublicKey: Buffer) {
  const prefix = Buffer.from("302a300506032b6570032100", "hex");
  return Buffer.concat([prefix, rawPublicKey]);
}

async function fetchJwks() {
  if (jwksCache && Date.now() < jwksCache.expiresAt) {
    return jwksCache.keys;
  }

  const response = await fetch(FAL_JWKS_URL, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Failed to fetch FAL JWKS: ${response.status}`);
  }

  const json = (await response.json()) as { keys?: JwksKey[] };
  const keys = Array.isArray(json.keys) ? json.keys : [];

  jwksCache = {
    keys,
    expiresAt: Date.now() + JWKS_CACHE_TTL_MS,
  };

  return keys;
}

async function verifyFalWebhookSignature(
  requestId: string,
  userId: string,
  timestamp: string,
  signatureHex: string,
  rawBody: string,
) {
  const timestampInt = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(timestampInt)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampInt) > MAX_TIMESTAMP_DRIFT_SECONDS) {
    return false;
  }

  const bodyHash = createHash("sha256").update(rawBody, "utf8").digest("hex");
  const message = Buffer.from(
    `${requestId}\n${userId}\n${timestamp}\n${bodyHash}`,
    "utf8",
  );
  const signature = Buffer.from(signatureHex, "hex");
  const keys = await fetchJwks();

  for (const key of keys) {
    if (key.kty !== "OKP" || key.crv !== "Ed25519" || !key.x) {
      continue;
    }

    const rawPublicKey = base64UrlToBuffer(key.x);
    const publicKey = createPublicKey({
      key: buildEd25519SpkiKey(rawPublicKey),
      format: "der",
      type: "spki",
    });

    if (verify(null, message, publicKey, signature)) {
      return true;
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request.headers.get("x-request-id"));
  const rawBody = await request.text();
  const webhookRequestId = request.headers.get("x-fal-webhook-request-id");
  const webhookUserId = request.headers.get("x-fal-webhook-user-id");
  const webhookTimestamp = request.headers.get("x-fal-webhook-timestamp");
  const webhookSignature = request.headers.get("x-fal-webhook-signature");

  if (!webhookRequestId || !webhookUserId || !webhookTimestamp || !webhookSignature) {
    logError("webhook_failed", {
      request_id: requestId,
      stage: "webhook_received",
      status: "failed",
      error_code: ERROR_CODES.WEBHOOK_FAILED,
      failure_reason: "missing_fal_signature_headers",
    });
    return NextResponse.json({ error: "Invalid signature headers" }, { status: 401 });
  }

  try {
    const signatureOk = await verifyFalWebhookSignature(
      webhookRequestId,
      webhookUserId,
      webhookTimestamp,
      webhookSignature,
      rawBody,
    );

    if (!signatureOk) {
      logError("webhook_failed", {
        request_id: requestId,
        stage: "webhook_received",
        status: "failed",
        error_code: ERROR_CODES.WEBHOOK_FAILED,
        failure_reason: "invalid_fal_signature",
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const payload = JSON.parse(rawBody) as {
      request_id?: string;
      status?: string;
      error?: string;
    };
    const providerTaskId = payload.request_id ?? null;
    const providerStatus = payload.status ?? null;

    if (!providerTaskId) {
      return NextResponse.json({ received: true });
    }

    const supabase = createServiceRoleClient();
    const { data: song } = await supabase
      .from("songs")
      .select("id,user_id,status")
      .eq("audio_provider", "fal")
      .eq("audio_provider_task_id", providerTaskId)
      .maybeSingle();

    if (!song) {
      return NextResponse.json({ received: true });
    }

    if (providerStatus === "OK") {
      await supabase
        .from("songs")
        .update({
          audio_provider_status: providerStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", song.id)
        .eq("status", "generating");

      logInfo("webhook_processed", {
        request_id: requestId,
        stage: "webhook_processed",
        status: "succeeded",
        song_id: song.id,
        provider_task_id: providerTaskId,
        provider_status: providerStatus,
      });

      return NextResponse.json({ received: true });
    }

    if (providerStatus === "ERROR") {
      const { data: updatedSong } = await supabase
        .from("songs")
        .update({
          status: "failed",
          audio_provider_status: providerStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", song.id)
        .eq("status", "generating")
        .select("id,user_id")
        .maybeSingle();

      if (updatedSong) {
        await refundAudioGenerationCredit({
          supabase,
          userId: updatedSong.user_id,
          requestId,
          songId: updatedSong.id,
          creditCost: falProvider.creditCost,
          description: "audio_generation_refund",
          metadata: { operation: "audio_generation" },
          stage: "webhook_processed",
        });
      }

      logError("webhook_failed", {
        request_id: requestId,
        stage: "webhook_processed",
        status: "failed",
        song_id: song.id,
        provider_task_id: providerTaskId,
        error_code: ERROR_CODES.WEBHOOK_FAILED,
        failure_reason: payload.error ?? "fal_webhook_error_status",
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logError("webhook_failed", {
      request_id: requestId,
      stage: "webhook_processed",
      status: "failed",
      error_code: ERROR_CODES.WEBHOOK_FAILED,
      failure_reason: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ received: true });
  }
}
