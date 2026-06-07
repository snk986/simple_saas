#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import ffprobeStatic from "ffprobe-static";

const TEMPLATE_DIR = "marketing-video/hyperframes/minimal-lyric-wave";
const DEFAULT_FFMPEG =
  "D:/DevTools/WeFlow/resources/app.asar.unpacked/node_modules/ffmpeg-static/ffmpeg.exe";
const FPS = 30;
const BAR_COUNT = 48;

function parseArgs() {
  const manifestFlag = process.argv.indexOf("--manifest");
  const manifest = manifestFlag >= 0 ? process.argv[manifestFlag + 1] : null;
  if (!manifest) {
    throw new Error(
      "Usage: pnpm video:lyric -- --manifest marketing-video/manifests/<song>-lyric.json",
    );
  }
  return { manifest };
}

function loadDotEnvLocal() {
  const envPath = path.resolve(".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line.trim());
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function run(command, args, label, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? "unknown"}`);
  }
}

function getFfmpegPath() {
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  if (existsSync(DEFAULT_FFMPEG)) return DEFAULT_FFMPEG;
  return "ffmpeg";
}

function createSupabaseClient() {
  loadDotEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server credentials are required");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchSong(songId) {
  const { data, error } = await createSupabaseClient()
    .from("songs")
    .select("id,title,audio_url,cover_url,style_tags")
    .eq("id", songId)
    .single();
  if (error) throw error;
  if (!data?.audio_url || !data?.cover_url) {
    throw new Error("Song audio or cover is missing");
  }
  return data;
}

function validateConfig(manifest) {
  const config = manifest.hyperframes;
  if (!manifest.supabase?.songId) throw new Error("supabase.songId is required");
  if (!config) throw new Error("hyperframes config is required");
  if (!Number.isFinite(config.audioStart) || !Number.isFinite(config.audioEnd)) {
    throw new Error("hyperframes.audioStart and audioEnd must be numbers");
  }
  if (config.audioEnd <= config.audioStart) {
    throw new Error("hyperframes.audioEnd must be after audioStart");
  }
  if (!config.lyricsTimingPath) {
    throw new Error("hyperframes.lyricsTimingPath is required");
  }
  if (!config.output) throw new Error("hyperframes.output is required");
  return config;
}

async function download(url, output, attempt = 0) {
  mkdirSync(path.dirname(output), { recursive: true });
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }
    writeFileSync(output, Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    if (attempt === 0) return download(url, output, attempt + 1);
    throw error;
  }
}

function loadManualLyrics(config, manifestPath, duration) {
  const timingPath = path.resolve(
    path.dirname(manifestPath),
    config.lyricsTimingPath,
  );
  const parsed = JSON.parse(readFileSync(timingPath, "utf8"));
  if (parsed.timebase !== "clip" || !Array.isArray(parsed.lyrics)) {
    throw new Error('Lyrics timing must contain timebase "clip" and a lyrics array');
  }

  const lyrics = parsed.lyrics
    .filter(
      (item) =>
        typeof item?.text === "string" &&
        item.text.trim() &&
        Number.isFinite(item.start) &&
        Number.isFinite(item.end),
    )
    .map((item) => ({
      text: item.text.trim(),
      start: Number(Math.max(0, item.start).toFixed(2)),
      end: Number(Math.min(duration, item.end).toFixed(2)),
    }))
    .filter((item) => item.end > item.start);

  if (lyrics.length === 0) {
    throw new Error("Lyrics timing has no entries inside the selected clip");
  }
  return lyrics;
}

function decodeSegment(ffmpeg, audioPath, audioStart, duration) {
  const result = spawnSync(
    ffmpeg,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      String(audioStart),
      "-t",
      String(duration),
      "-i",
      audioPath,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "12000",
      "-f",
      "s16le",
      "-acodec",
      "pcm_s16le",
      "pipe:1",
    ],
    { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 },
  );
  if (result.status !== 0) {
    throw new Error(`Audio decode failed: ${result.stderr?.toString()}`);
  }
  return new Int16Array(
    result.stdout.buffer,
    result.stdout.byteOffset,
    result.stdout.byteLength / 2,
  );
}

function buildWaveform(samples, duration) {
  const totalFrames = Math.floor(duration * FPS);
  const samplesPerFrame = Math.floor(samples.length / totalFrames);
  const raw = [];
  let peak = 1;

  for (let frame = 0; frame < totalFrames; frame += 1) {
    const start = frame * samplesPerFrame;
    const frameBars = [];
    for (let bar = 0; bar < BAR_COUNT; bar += 1) {
      const from = start + Math.floor((bar / BAR_COUNT) * samplesPerFrame);
      const to = start + Math.floor(((bar + 1) / BAR_COUNT) * samplesPerFrame);
      let sum = 0;
      for (let index = from; index < to; index += 1) {
        sum += Math.abs(samples[index] ?? 0);
      }
      const value = sum / Math.max(1, to - from);
      peak = Math.max(peak, value);
      frameBars.push(value);
    }
    raw.push(frameBars);
  }

  return raw.map((frameBars, frame) =>
    frameBars.map((value, bar) => {
      const normalized = Math.pow(value / peak, 0.62);
      const shaped =
        normalized * (0.62 + 0.38 * Math.sin(((bar + 1) / BAR_COUNT) * Math.PI));
      const previous = frame > 0 ? raw[frame - 1][bar] / peak : shaped;
      return Number((previous * 0.35 + shaped * 0.65).toFixed(3));
    }),
  );
}

function prepareWorkTemplate(templateDir, workDir, duration, audioStart) {
  cpSync(templateDir, workDir, {
    recursive: true,
    filter: (source) => {
      const relative = path.relative(templateDir, source);
      const topLevel = relative.split(path.sep)[0];
      return !["assets", "check-frames", "data", "renders"].includes(topLevel);
    },
  });
  const indexPath = path.join(workDir, "index.html");
  const html = readFileSync(indexPath, "utf8")
    .replaceAll('data-duration="15"', `data-duration="${duration}"`)
    .replace('data-media-start="0"', `data-media-start="${audioStart}"`);
  writeFileSync(indexPath, html);
}

function extractCheckFrames(ffmpeg, output, checkDir, timestamps) {
  mkdirSync(checkDir, { recursive: true });
  for (const timestamp of timestamps) {
    run(
      ffmpeg,
      [
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-ss",
        String(timestamp),
        "-i",
        output,
        "-frames:v",
        "1",
        path.join(checkDir, `check-${timestamp}s.png`),
      ],
      `check frame ${timestamp}s`,
    );
  }
}

async function main() {
  const { manifest: manifestArg } = parseArgs();
  const manifestPath = path.resolve(manifestArg);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const config = validateConfig(manifest);
  const duration = Number((config.audioEnd - config.audioStart).toFixed(3));
  const lyrics = loadManualLyrics(config, manifestPath, duration);
  const song = await fetchSong(manifest.supabase.songId);
  const templateDir = path.resolve(TEMPLATE_DIR);
  const workDir = path.join(path.dirname(templateDir), ".work", "minimal-lyric-wave");
  const assetDir = path.join(workDir, "assets");
  const dataDir = path.join(workDir, "data");
  const checkDir = path.join(templateDir, "check-frames");
  const audioPath = path.join(assetDir, "song.mp3");
  const coverPath = path.join(assetDir, "cover.jpg");
  const output = path.resolve(config.output);
  const ffmpeg = getFfmpegPath();

  prepareWorkTemplate(templateDir, workDir, duration, config.audioStart);
  await download(song.audio_url, audioPath);
  await download(song.cover_url, coverPath);

  const samples = decodeSegment(ffmpeg, audioPath, config.audioStart, duration);
  const videoData = {
    title: song.title,
    style: Array.isArray(song.style_tags)
      ? song.style_tags.slice(0, 3).join(" / ")
      : "Original song",
    audioStart: config.audioStart,
    duration,
    fps: FPS,
    lyrics,
    waveform: buildWaveform(samples, duration),
  };

  mkdirSync(dataDir, { recursive: true });
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(
    path.join(dataDir, "song-data.js"),
    `window.CALYRA_VIDEO = ${JSON.stringify(videoData)};\n`,
  );

  const hyperframesBin = path.resolve("node_modules/.bin/hyperframes.CMD");
  const binaryDirs = [path.dirname(ffmpeg), path.dirname(ffprobeStatic.path)].join(
    path.delimiter,
  );
  const env = {
    ...process.env,
    PATH: `${binaryDirs}${path.delimiter}${process.env.PATH ?? ""}`,
  };
  const runOptions = { env, shell: process.platform === "win32" };
  run(hyperframesBin, ["lint", workDir], "HyperFrames lint", runOptions);
  run(
    hyperframesBin,
    [
      "render",
      workDir,
      "--output",
      output,
      "--fps",
      String(FPS),
      "--quality",
      "high",
      "--workers",
      "1",
      "--strict",
      "--low-memory-mode",
    ],
    "HyperFrames render",
    runOptions,
  );

  extractCheckFrames(
    ffmpeg,
    output,
    checkDir,
    config.inspectionTimestamps ?? [1, Math.floor(duration / 2), duration - 1],
  );
  console.log(`[calyra-lyric] video: ${output}`);
  console.log(`[calyra-lyric] check frames: ${checkDir}`);
}

main().catch((error) => {
  console.error(`[calyra-lyric] ${error.stack ?? error.message ?? error}`);
  process.exit(1);
});
