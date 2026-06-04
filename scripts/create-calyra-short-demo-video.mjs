#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_MANIFEST = "marketing-video/manifests/back-in-the-light.json";
const DEFAULT_FFMPEG =
  "D:/DevTools/WeFlow/resources/app.asar.unpacked/node_modules/ffmpeg-static/ffmpeg.exe";
const PRIVACY_TERMS = [
  "supabase",
  "creem",
  "anthropic",
  "kie.ai",
  "api key",
  "apikey",
  "secret",
  "token",
  "bearer",
  "uuid",
  "billing",
  "invoice",
  ".env",
  "localhost",
];

function parseArgs() {
  const args = { manifest: DEFAULT_MANIFEST, checkOnly: false };
  for (let index = 2; index < process.argv.length; index += 1) {
    const arg = process.argv[index];
    if (arg === "--manifest") {
      args.manifest = process.argv[index + 1];
      index += 1;
    } else if (arg === "--check") {
      args.checkOnly = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/create-calyra-short-demo-video.mjs [--manifest path] [--check]");
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function loadDotEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function resolveRepo(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

function assertFile(filePath, label) {
  if (!existsSync(filePath)) {
    throw new Error(`${label} is missing: ${filePath}`);
  }
}

function getFfmpegPath() {
  const explicit = process.env.FFMPEG_PATH;
  if (explicit && existsSync(explicit)) return explicit;
  if (existsSync(DEFAULT_FFMPEG)) return DEFAULT_FFMPEG;
  return "ffmpeg";
}

function findBrowserExecutable() {
  const explicit = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (explicit && existsSync(explicit)) return explicit;

  if (process.platform !== "win32") return undefined;

  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    path.join(process.env.LOCALAPPDATA ?? "", "Google/Chrome/Application/chrome.exe"),
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    path.join(process.env.LOCALAPPDATA ?? "", "Microsoft/Edge/Application/msedge.exe"),
  ];

  return candidates.find((candidate) => candidate && existsSync(candidate));
}

function run(command, args, label) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? "unknown"}`);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

function dataUrl(filePath) {
  return `data:${mimeFor(filePath)};base64,${readFileSync(filePath).toString("base64")}`;
}

function validatePrivacy(manifest) {
  const text = JSON.stringify({
    title: manifest.title,
    output: manifest.output,
    scenes: manifest.scenes,
    captions: manifest.captions,
  }).toLowerCase();
  const hits = PRIVACY_TERMS.filter((term) => text.includes(term));
  if (hits.length) {
    throw new Error(`Privacy text check failed. Remove these terms from visible copy/paths: ${hits.join(", ")}`);
  }
}

function validateManifest(manifest) {
  if (!manifest.supabase?.songId) throw new Error("manifest.supabase.songId is required");
  if (!manifest.assets?.audioPath) throw new Error("manifest.assets.audioPath is required");
  if (!manifest.assets?.coverPath) throw new Error("manifest.assets.coverPath is required");
  if (!Array.isArray(manifest.scenes) || manifest.scenes.length === 0) {
    throw new Error("manifest.scenes must contain scenes");
  }
  for (const scene of manifest.scenes) {
    if (!scene.id) throw new Error("Every scene needs id");
    if (!Number.isFinite(scene.duration) || scene.duration <= 0) {
      throw new Error(`Scene ${scene.id} needs a positive duration`);
    }
    if (!scene.caption) throw new Error(`Scene ${scene.id} needs caption`);
  }
  validatePrivacy(manifest);
}

function createSupabaseClient() {
  loadDotEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY are required");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchSong(manifest) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("songs")
    .select("id,title,lyrics,user_input,audio_url,audio_url_alt,selected_audio,cover_url,style_tags")
    .eq("id", manifest.supabase.songId)
    .single();
  if (error) throw error;
  if (!data?.audio_url) throw new Error(`Song ${manifest.supabase.songId} has no audio_url`);
  if (!data?.cover_url) throw new Error(`Song ${manifest.supabase.songId} has no cover_url`);
  return data;
}

async function downloadToFile(url, outputPath, label) {
  const absoluteOutput = resolveRepo(outputPath);
  mkdirSync(path.dirname(absoluteOutput), { recursive: true });
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      writeFileSync(absoluteOutput, buffer);
      console.log(`[calyra-short] downloaded ${label}: ${absoluteOutput}`);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 750));
      }
    }
  }
  throw new Error(`Failed to download ${label}: ${lastError?.message ?? lastError}`);
}

function parseStory(userInput) {
  const styleMatch = /Style:\s*([\s\S]*?)(?:\nPrompt:|$)/i.exec(userInput ?? "");
  return {
    story: "I was quiet for a minute. Now I want a comeback song.",
    style:
      styleMatch?.[1]?.trim() ??
      "Modern summer dance-pop, confident female lead vocal, bright beat",
  };
}

function lyricLines(lyrics) {
  const cleaned = String(lyrics ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^\[.*\]$/.test(line));
  const chorusStart = cleaned.findIndex((line) => /back in the light/i.test(line));
  const start = chorusStart >= 0 ? chorusStart : 0;
  return cleaned.slice(start, start + 5);
}

function visibleSong(song) {
  const parsed = parseStory(song.user_input);
  return {
    title: song.title,
    styleTags: Array.isArray(song.style_tags) ? song.style_tags : [],
    story: parsed.story,
    style: parsed.style,
    lyrics: lyricLines(song.lyrics),
  };
}

function frameHtml({ scene, song, coverUrl }) {
  const tags = song.styleTags.slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  const lyricHtml = song.lyrics.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  const panel = {
    player: `
      <section class="phone player">
        <div class="cover"><img src="${coverUrl}" alt=""></div>
        <div class="songTitle">${escapeHtml(song.title)}</div>
        <div class="tags">${tags}</div>
        <div class="wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="controls"><b></b><strong></strong><b></b></div>
      </section>`,
    input: `
      <section class="phone">
        <div class="label">Story</div>
        <div class="textBox">${escapeHtml(song.story)}</div>
        <div class="label">Style</div>
        <div class="styleBox">${escapeHtml(song.style)}</div>
        <button>Generate song</button>
      </section>`,
    generate: `
      <section class="phone center">
        <div class="pulse"></div>
        <div class="songTitle">Generating ${escapeHtml(song.title)}</div>
        <div class="progress"><em></em></div>
        <div class="status">Writing lyrics · shaping vocals · mixing preview</div>
      </section>`,
    lyrics: `
      <section class="phone">
        <div class="songTitle">${escapeHtml(song.title)}</div>
        <div class="lyrics">${lyricHtml}</div>
      </section>`,
  }[scene.type];

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background: #f7faf8;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #151816;
      }
      .stage {
        position: relative;
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background:
          linear-gradient(135deg, rgba(255,255,255,.96), rgba(237,246,242,.96)),
          radial-gradient(circle at 82% 8%, rgba(254,202,87,.28), transparent 34%),
          radial-gradient(circle at 10% 92%, rgba(42,157,143,.20), transparent 36%);
      }
      .brand {
        position: absolute;
        top: 70px;
        left: 64px;
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 30px;
        font-weight: 780;
      }
      .mark {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        background: #111816;
        color: white;
        display: grid;
        place-items: center;
      }
      .phone {
        position: absolute;
        left: 102px;
        right: 102px;
        top: 232px;
        height: 1038px;
        border: 1px solid rgba(19, 26, 22, .12);
        border-radius: 34px;
        background: rgba(255,255,255,.92);
        box-shadow: 0 38px 120px rgba(23, 36, 30, .18);
        padding: 54px;
      }
      .phone.center {
        display: grid;
        place-items: center;
        text-align: center;
        align-content: center;
        gap: 32px;
      }
      .cover {
        width: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 24px;
        overflow: hidden;
        background: #dfe9e4;
      }
      .cover img { width: 100%; height: 100%; object-fit: cover; }
      .player .cover {
        height: 640px;
        aspect-ratio: auto;
      }
      .songTitle {
        margin-top: 36px;
        font-size: 52px;
        line-height: 1.05;
        font-weight: 830;
        letter-spacing: 0;
      }
      .tags { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 22px; }
      .tags span {
        padding: 12px 16px;
        border-radius: 8px;
        background: #e9f2ee;
        font-size: 23px;
        font-weight: 700;
      }
      .wave {
        height: 84px;
        margin-top: 50px;
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .player .wave {
        height: 58px;
        margin-top: 30px;
      }
      .wave i {
        width: 28px;
        border-radius: 8px;
        background: #209675;
      }
      .wave i:nth-child(1) { height: 32px; }
      .wave i:nth-child(2) { height: 74px; }
      .wave i:nth-child(3) { height: 46px; }
      .wave i:nth-child(4) { height: 84px; }
      .wave i:nth-child(5) { height: 56px; }
      .wave i:nth-child(6) { height: 72px; }
      .wave i:nth-child(7) { height: 38px; }
      .controls { display: flex; justify-content: center; align-items: center; gap: 34px; margin-top: 32px; }
      .player .controls { margin-top: 26px; }
      .controls b, .controls strong {
        display: block;
        border-radius: 50%;
        background: #151816;
      }
      .controls b { width: 52px; height: 52px; opacity: .28; }
      .controls strong { width: 86px; height: 86px; }
      .player .controls b { width: 44px; height: 44px; }
      .player .controls strong { width: 68px; height: 68px; }
      .label {
        margin: 0 0 16px;
        color: #65736b;
        font-size: 25px;
        font-weight: 760;
        text-transform: uppercase;
      }
      .textBox, .styleBox {
        border-radius: 18px;
        background: #f3f7f5;
        border: 1px solid rgba(19,26,22,.08);
        padding: 30px;
        font-size: 38px;
        line-height: 1.25;
        font-weight: 720;
      }
      .styleBox {
        margin-bottom: 46px;
        font-size: 29px;
        line-height: 1.32;
        color: #38433d;
      }
      button {
        width: 100%;
        height: 84px;
        border: 0;
        border-radius: 8px;
        background: #151816;
        color: white;
        font-size: 31px;
        font-weight: 780;
      }
      .pulse {
        width: 162px;
        height: 162px;
        border-radius: 50%;
        background: #209675;
        box-shadow: 0 0 0 28px rgba(32,150,117,.12), 0 0 0 62px rgba(32,150,117,.06);
      }
      .progress {
        width: 620px;
        height: 18px;
        border-radius: 8px;
        background: #e3ebe7;
        overflow: hidden;
      }
      .progress em {
        display: block;
        width: 68%;
        height: 100%;
        background: #209675;
      }
      .status {
        color: #65736b;
        font-size: 28px;
        font-weight: 700;
      }
      .lyrics p {
        margin: 0 0 24px;
        padding-bottom: 24px;
        border-bottom: 1px solid rgba(19,26,22,.08);
        font-size: 38px;
        line-height: 1.18;
        font-weight: 760;
      }
      .caption {
        position: absolute;
        left: 64px;
        right: 64px;
        bottom: 214px;
        color: #111816;
      }
      .caption.top {
        top: 1340px;
        bottom: auto;
      }
      .caption h1 {
        margin: 0;
        max-width: 910px;
        font-size: 75px;
        line-height: 1.04;
        letter-spacing: 0;
      }
      .caption p {
        margin: 22px 0 0;
        max-width: 820px;
        color: #4f5e55;
        font-size: 37px;
        line-height: 1.18;
        font-weight: 680;
      }
    </style>
  </head>
  <body>
    <main class="stage">
      <div class="brand"><div class="mark">C</div><div>Calyra AI</div></div>
      ${panel}
      <section class="caption ${scene.captionPosition ?? ""}">
        <h1>${escapeHtml(scene.caption)}</h1>
        ${scene.support ? `<p>${escapeHtml(scene.support)}</p>` : ""}
      </section>
    </main>
  </body>
</html>`;
}

async function renderFrames(manifest, song) {
  const frameDir = resolveRepo(path.join(manifest.workDir, "frames"));
  mkdirSync(frameDir, { recursive: true });
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: findBrowserExecutable(),
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1080, height: 1920, deviceScaleFactor: 1 },
  });

  try {
    const page = await browser.newPage();
    const visible = visibleSong(song);
    const coverUrl = dataUrl(resolveRepo(manifest.assets.coverPath));
    for (const [index, scene] of manifest.scenes.entries()) {
      const html = frameHtml({ scene, song: visible, coverUrl });
      const output = path.join(frameDir, `${String(index + 1).padStart(2, "0")}-${scene.id}.png`);
      await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 10000 });
      await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete), {
        timeout: 10000,
      });
      await page.screenshot({ path: output, type: "png" });
      console.log(`[calyra-short] rendered frame: ${output}`);
    }
  } finally {
    await browser.close();
  }
}

function writeConcatList(files, output) {
  writeFileSync(
    output,
    files.map((file) => `file '${file.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n") + "\n",
  );
}

function exportVideo(manifest) {
  const ffmpeg = getFfmpegPath();
  const workDir = resolveRepo(manifest.workDir);
  const frameDir = path.join(workDir, "frames");
  const segmentDir = path.join(workDir, "segments");
  const checkDir = path.join(workDir, "check-frames");
  const output = resolveRepo(manifest.output);
  mkdirSync(segmentDir, { recursive: true });
  mkdirSync(checkDir, { recursive: true });
  mkdirSync(path.dirname(output), { recursive: true });

  const segments = manifest.scenes.map((scene, index) => {
    const frame = path.join(frameDir, `${String(index + 1).padStart(2, "0")}-${scene.id}.png`);
    const segment = path.join(segmentDir, `${String(index + 1).padStart(2, "0")}-${scene.id}.mp4`);
    assertFile(frame, `Frame ${scene.id}`);
    run(
      ffmpeg,
      [
        "-y",
        "-hide_banner",
        "-loop",
        "1",
        "-t",
        String(scene.duration),
        "-i",
        frame,
        "-vf",
        "scale=1080:1920,format=yuv420p",
        "-r",
        String(manifest.fps ?? 30),
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        segment,
      ],
      `segment ${scene.id}`,
    );
    return segment;
  });

  const concatList = path.join(segmentDir, "segments.txt");
  const silentVideo = path.join(segmentDir, "silent-video.mp4");
  const mixedAudio = path.join(segmentDir, "mixed-audio.m4a");
  writeConcatList(segments, concatList);
  run(ffmpeg, ["-y", "-hide_banner", "-f", "concat", "-safe", "0", "-i", concatList, "-c", "copy", silentVideo], "concat");

  const audioInput = resolveRepo(manifest.assets.audioPath);
  assertFile(audioInput, "Audio");
  const audioFilters = manifest.scenes
    .map((scene, index) => {
      const start = Number.isFinite(scene.audioStart) ? scene.audioStart : 0;
      const volume = Number.isFinite(scene.audioVolume) ? scene.audioVolume : 0.4;
      return `[0:a]atrim=start=${start}:duration=${scene.duration},asetpts=PTS-STARTPTS,volume=${volume}[a${index}]`;
    })
    .join(";");
  const audioLabels = manifest.scenes.map((_, index) => `[a${index}]`).join("");
  const totalDuration = manifest.scenes.reduce((sum, scene) => sum + scene.duration, 0);
  const fadeStart = Math.max(0, totalDuration - 0.35).toFixed(2);
  const filter = `${audioFilters};${audioLabels}concat=n=${manifest.scenes.length}:v=0:a=1,afade=t=out:st=${fadeStart}:d=0.35[aout]`;

  run(
    ffmpeg,
    [
      "-y",
      "-hide_banner",
      "-i",
      audioInput,
      "-filter_complex",
      filter,
      "-map",
      "[aout]",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-map_metadata",
      "-1",
      mixedAudio,
    ],
    "audio mix",
  );

  run(
    ffmpeg,
    [
      "-y",
      "-hide_banner",
      "-i",
      silentVideo,
      "-i",
      mixedAudio,
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-shortest",
      "-movflags",
      "+faststart",
      "-map_metadata",
      "-1",
      output,
    ],
    "final export",
  );

  for (const timestamp of manifest.inspectionTimestamps ?? [1, 6, 12, 18]) {
    const checkFrame = path.join(checkDir, `check-${String(timestamp).replace(".", "_")}s.png`);
    run(
      ffmpeg,
      ["-y", "-hide_banner", "-ss", String(timestamp), "-i", output, "-frames:v", "1", "-update", "1", checkFrame],
      `check frame ${timestamp}s`,
    );
  }

  console.log(`[calyra-short] final video: ${output}`);
  console.log(`[calyra-short] check frames: ${checkDir}`);
}

async function main() {
  const args = parseArgs();
  const manifestPath = resolveRepo(args.manifest);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  validateManifest(manifest);

  const ffmpeg = getFfmpegPath();
  run(ffmpeg, ["-version"], "ffmpeg availability");
  const song = await fetchSong(manifest);

  await downloadToFile(song.audio_url, manifest.assets.audioPath, "song audio");
  await downloadToFile(song.cover_url, manifest.assets.coverPath, "cover image");

  if (args.checkOnly) {
    console.log("[calyra-short] check complete. Assets downloaded; video export skipped.");
    return;
  }

  await renderFrames(manifest, song);
  exportVideo(manifest);
}

main().catch((error) => {
  console.error(`[calyra-short] ${error.stack ?? error.message ?? error}`);
  process.exit(1);
});
