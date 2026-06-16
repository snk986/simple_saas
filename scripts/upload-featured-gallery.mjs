import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";

const DEFAULT_BUCKET = "calyra-ai-media";

function loadDotEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    if (process.env[key]) {
      continue;
    }

    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function contentTypeForPath(path) {
  const ext = extname(path).toLowerCase();
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".ogg") return "audio/ogg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function extensionForPath(path, fallback) {
  const ext = extname(path).replace(".", "").toLowerCase();
  return ext || fallback;
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function readManifest(path) {
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  const ownerUserId = parsed.ownerUserId;
  const songs = Array.isArray(parsed) ? parsed : parsed.songs;

  if (!ownerUserId || typeof ownerUserId !== "string") {
    throw new Error("Manifest ownerUserId is required");
  }

  if (!Array.isArray(songs) || songs.length === 0) {
    throw new Error("Manifest songs must contain at least one item");
  }

  return { ownerUserId, songs };
}

async function ensureBucket(supabase, bucket) {
  const { data } = await supabase.storage.getBucket(bucket);
  if (data) {
    return;
  }

  const { error } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: "50MB",
  });
  if (error) {
    throw error;
  }
}

async function uploadLocalFile(supabase, bucket, localPath, storagePath) {
  const absolutePath = resolve(localPath);
  if (!existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const body = readFileSync(absolutePath);
  const { error } = await supabase.storage.from(bucket).upload(storagePath, body, {
    contentType: contentTypeForPath(absolutePath),
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return publicUrl;
}

async function findExistingOfficialSong(supabase, song) {
  if (song.songId) {
    return song.songId;
  }

  const { data, error } = await supabase
    .from("songs")
    .select("id")
    .eq("source_type", "official_upload")
    .eq("title", song.title)
    .eq("featured_artist", song.artist)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

function validateSong(song, index) {
  for (const key of ["rank", "title", "artist", "audioPath", "coverPath"]) {
    if (song[key] === undefined || song[key] === null || song[key] === "") {
      throw new Error(`Song ${index + 1} is missing ${key}`);
    }
  }
}

function getTitleFilter() {
  const titleIndex = process.argv.indexOf("--title");
  if (titleIndex === -1) {
    return null;
  }

  const title = process.argv[titleIndex + 1]?.trim();
  if (!title) {
    throw new Error("--title requires a song title");
  }

  return title;
}

async function main() {
  loadDotEnvLocal();

  const manifestPath = process.argv[2];
  if (!manifestPath) {
    throw new Error(
      "Usage: node scripts/upload-featured-gallery.mjs scripts/featured-gallery.local.json",
    );
  }

  const { ownerUserId, songs } = readManifest(resolve(manifestPath));
  const titleFilter = getTitleFilter();
  const songsToUpload = titleFilter
    ? songs.filter((song) => song.title === titleFilter)
    : songs;

  if (titleFilter && songsToUpload.length === 0) {
    throw new Error(`No song found with title: ${titleFilter}`);
  }

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
  const bucket = process.env.SUPABASE_MEDIA_BUCKET || DEFAULT_BUCKET;

  await ensureBucket(supabase, bucket);

  for (const [index, song] of songsToUpload.entries()) {
    validateSong(song, index);

    const existingSongId = await findExistingOfficialSong(supabase, song);
    const songId = existingSongId || randomUUID();
    const baseName = slugify(song.title) || slugify(basename(song.audioPath));
    const audioPath = `songs/${songId}/audio/primary.${extensionForPath(
      song.audioPath,
      "mp3",
    )}`;
    const coverPath = `songs/${songId}/cover/cover.${extensionForPath(
      song.coverPath,
      "jpg",
    )}`;

    const audioUrl = await uploadLocalFile(
      supabase,
      bucket,
      song.audioPath,
      audioPath,
    );
    const coverUrl = await uploadLocalFile(
      supabase,
      bucket,
      song.coverPath,
      coverPath,
    );

    const now = new Date().toISOString();
    const row = {
      id: songId,
      user_id: ownerUserId,
      title: song.title,
      lyrics: song.lyrics || "",
      user_input: song.userInput || "Official featured gallery upload",
      audio_url: audioUrl,
      audio_url_alt: null,
      selected_audio: "primary",
      cover_url: coverUrl,
      lyrics_regen_count: 0,
      style_key: song.styleKey || "custom",
      style_params: song.styleParams || {},
      style_tags: Array.isArray(song.styleTags) ? song.styleTags : [],
      locale: song.locale || "en",
      status: "ready",
      is_public: true,
      play_count: song.playCount ?? 0,
      complete_count: song.completeCount ?? 0,
      share_count: song.shareCount ?? 0,
      like_count: song.likeCount ?? 0,
      cta_click_count: song.ctaClickCount ?? 0,
      audio_provider: song.audioProvider || "manual",
      audio_provider_task_id: song.audioProviderTaskId || `manual:${songId}`,
      audio_provider_status: "manual_upload",
      source_type: "official_upload",
      is_featured: true,
      featured_rank: song.rank,
      featured_artist: song.artist,
      featured_badge: song.badge || null,
      featured_active: song.featuredActive ?? true,
      featured_at: song.featuredAt || now,
      updated_at: now,
    };

    const { error } = await supabase.from("songs").upsert(row, {
      onConflict: "id",
    });

    if (error) {
      throw error;
    }

    console.log(
      `${existingSongId ? "Updated" : "Uploaded"} #${song.rank}: ${song.title} (${baseName}) -> ${songId}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
