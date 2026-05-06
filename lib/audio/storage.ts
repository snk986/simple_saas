import { createServiceRoleClient } from "@/utils/supabase/service-role";

const DEFAULT_BUCKET = "hit-song-media";

function getBucketName() {
  return process.env.SUPABASE_MEDIA_BUCKET ?? DEFAULT_BUCKET;
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
  const extension = extensionFromContentType(contentType, input.fallbackExtension);
  const path = `${input.pathPrefix}/${input.fileName}.${extension}`;
  const supabase = createServiceRoleClient();
  const bucket = getBucketName();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, {
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

export async function uploadPollinationsCover(input: {
  songId: string;
  title: string;
  styleTags: string[];
}) {
  const prompt = [
    "square album cover art",
    input.title,
    input.styleTags.join(", "),
    "cinematic lighting, clean typography-free composition",
  ]
    .filter(Boolean)
    .join(", ");
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt,
  )}?width=1024&height=1024&model=flux&nologo=true&safe=true`;

  return uploadRemoteMedia({
    url,
    pathPrefix: `songs/${input.songId}/cover`,
    fileName: "cover",
    fallbackExtension: "jpg",
  });
}
