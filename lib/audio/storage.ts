import { createServiceRoleClient } from "@/utils/supabase/service-role";

const DEFAULT_BUCKET = "calyra-ai-media";
const DEFAULT_COVER_PATH = "/og/calyra-ai-cover.jpg";

function getBucketName() {
  return process.env.SUPABASE_MEDIA_BUCKET ?? DEFAULT_BUCKET;
}

export function getDefaultCoverUrl() {
  const baseUrl = process.env.BASE_URL?.replace(/\/$/, "");

  if (!baseUrl) {
    return DEFAULT_COVER_PATH;
  }

  return `${baseUrl}${DEFAULT_COVER_PATH}`;
}

function extensionFromContentType(contentType: string, fallback: string) {
  if (contentType.includes("mpeg")) return "mp3";
  if (contentType.includes("wav")) return "wav";
  if (contentType.includes("ogg")) return "ogg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return fallback;
}

async function downloadFile(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.arrayBuffer();

  return { body, contentType };
}

export async function uploadRemoteMedia(input: {
  url: string;
  pathPrefix: string;
  fileName: string;
  fallbackExtension: string;
}) {
  const { body, contentType } = await downloadFile(input.url);
  const extension = extensionFromContentType(
    contentType,
    input.fallbackExtension,
  );
  const path = `${input.pathPrefix}/${input.fileName}.${extension}`;
  const supabase = createServiceRoleClient();
  const bucket = getBucketName();

  const { data: bucketInfo } = await supabase.storage.getBucket(bucket);

  if (!bucketInfo) {
    await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: "50MB",
    });
  }

  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType: contentType || undefined,
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

export async function uploadFreeCover(input: { songId: string }) {
  const seed = encodeURIComponent(`calyra-${input.songId}`);
  const url = `https://picsum.photos/seed/${seed}/1024/1024`;

  return uploadRemoteMedia({
    url,
    pathPrefix: `songs/${input.songId}/cover`,
    fileName: "cover",
    fallbackExtension: "jpg",
  });
}
