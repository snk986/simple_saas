import { NextRequest, NextResponse } from "next/server";
import { finalizeAudioGeneration } from "@/lib/audio/finalize-generation";
import { getRequestId, logError, logInfo } from "@/lib/observability/log";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

export const dynamic = "force-dynamic";

const DEFAULT_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 10;
const MIN_GENERATING_AGE_MS = 5 * 60 * 1000;

function getProvidedSecret(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }

  return (
    request.headers.get("x-cron-secret") ??
    request.nextUrl.searchParams.get("secret")
  );
}

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  return Boolean(cronSecret) && getProvidedSecret(request) === cronSecret;
}

function getBatchSize(request: NextRequest) {
  const raw = Number.parseInt(
    request.nextUrl.searchParams.get("limit") ?? "",
    10,
  );

  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.min(raw, MAX_BATCH_SIZE);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = getRequestId(request.headers.get("x-request-id"));
  const supabase = createServiceRoleClient();
  const cutoff = new Date(Date.now() - MIN_GENERATING_AGE_MS).toISOString();
  const limit = getBatchSize(request);
  const { data: songs, error } = await supabase
    .from("songs")
    .select("id,updated_at")
    .eq("status", "generating")
    .eq("audio_provider", "fal")
    .lt("created_at", cutoff)
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) {
    logError("audio_finalize_cron_failed", {
      request_id: requestId,
      stage: "audio_finalize_cron",
      status: "failed",
      failure_reason: error.message,
    });
    return NextResponse.json(
      { error: "Audio finalizer cron failed" },
      { status: 500 },
    );
  }

  const stats = {
    scanned: songs?.length ?? 0,
    completed: 0,
    generating: 0,
    failed: 0,
    errors: 0,
  };

  for (const song of songs ?? []) {
    try {
      const result = await finalizeAudioGeneration({
        songId: song.id,
        requestId,
        source: "cron",
      });

      if (result.status === "completed") {
        stats.completed += 1;
      } else if (result.status === "failed") {
        stats.failed += 1;
      } else {
        stats.generating += 1;
      }
    } catch (itemError) {
      stats.errors += 1;
      logError("audio_finalize_cron_item_failed", {
        request_id: requestId,
        song_id: song.id,
        stage: "audio_finalize_cron",
        status: "failed",
        failure_reason:
          itemError instanceof Error ? itemError.message : String(itemError),
      });
    }
  }

  logInfo("audio_finalize_cron_completed", {
    request_id: requestId,
    stage: "audio_finalize_cron",
    status: "succeeded",
    scanned: stats.scanned,
    completed: stats.completed,
    generating: stats.generating,
    failed: stats.failed,
    errors: stats.errors,
  });

  return NextResponse.json(stats);
}
