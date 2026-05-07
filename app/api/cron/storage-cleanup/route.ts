import { NextRequest, NextResponse } from "next/server";
import { getUserEntitlements } from "@/lib/subscription/entitlements";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

export const dynamic = "force-dynamic";

const DEFAULT_BUCKET = "hit-song-media";
const CLEANUP_BATCH_SIZE = 50;

function getBucketName() {
  return process.env.SUPABASE_MEDIA_BUCKET ?? DEFAULT_BUCKET;
}

function getProvidedSecret(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }

  return (
    request.headers.get("x-cron-secret") ?? request.nextUrl.searchParams.get("secret")
  );
}

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  return Boolean(cronSecret) && getProvidedSecret(request) === cronSecret;
}

function storagePathFromPublicUrl(url: string | null, bucket: string) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const markerIndex = parsed.pathname.indexOf(marker);

    if (markerIndex >= 0) {
      return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
    }

    const bucketIndex = parsed.pathname.indexOf(`/${bucket}/`);
    if (bucketIndex >= 0) {
      return decodeURIComponent(parsed.pathname.slice(bucketIndex + bucket.length + 2));
    }
  } catch {
    return null;
  }

  return null;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const bucket = getBucketName();
  const now = new Date().toISOString();
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";

  const { data: songs, error } = await supabase
    .from("songs")
    .select("id,user_id,audio_url,audio_url_alt,cover_url,expires_at,status")
    .lt("expires_at", now)
    .neq("status", "expired")
    .order("expires_at", { ascending: true })
    .limit(CLEANUP_BATCH_SIZE);

  if (error) {
    console.error("Storage cleanup query failed:", error);
    return NextResponse.json(
      { error: "Storage cleanup failed" },
      { status: 500 },
    );
  }

  const stats = {
    scanned: songs?.length ?? 0,
    expired: 0,
    kept: 0,
    failed: 0,
    dryRun,
  };

  for (const song of songs ?? []) {
    try {
      const entitlements = await getUserEntitlements(song.user_id);

      if (entitlements.canKeepSongsForever) {
        stats.kept += 1;

        if (!dryRun) {
          await supabase
            .from("songs")
            .update({ expires_at: null, updated_at: new Date().toISOString() })
            .eq("id", song.id);
        }

        continue;
      }

      const paths = [
        storagePathFromPublicUrl(song.audio_url, bucket),
        storagePathFromPublicUrl(song.audio_url_alt, bucket),
        storagePathFromPublicUrl(song.cover_url, bucket),
      ].filter((path): path is string => Boolean(path));

      if (!dryRun && paths.length > 0) {
        const { error: removeError } = await supabase.storage
          .from(bucket)
          .remove(Array.from(new Set(paths)));

        if (removeError) {
          throw removeError;
        }
      }

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from("songs")
          .update({
            status: "expired",
            is_public: false,
            audio_url: null,
            audio_url_alt: null,
            cover_url: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", song.id);

        if (updateError) {
          throw updateError;
        }
      }

      stats.expired += 1;
    } catch (cleanupError) {
      stats.failed += 1;
      console.error("Storage cleanup failed for song:", {
        songId: song.id,
        error:
          cleanupError instanceof Error
            ? cleanupError.message
            : "Unknown error",
      });
    }
  }

  return NextResponse.json(stats);
}
