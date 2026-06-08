#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  unlinkSync,
} from "node:fs";
import path from "node:path";
import ffprobeStatic from "ffprobe-static";

const TEMPLATE_DIR = "marketing-video/hyperframes/world-cup-demo";
const AUDIO_SOURCE = "D:/update-song/World Cup Fire.mp3";
const OUTPUT = "public/marketing/world-cup-demo-0-69s.mp4";
const FIRST_SECTION_DIR = "marketing-video/hyperframes/world-cup-demo/assets/conctry";
const COUNTRY_SECTION_DIR = "marketing-video/hyperframes/world-cup-demo/assets/contry1";
const CHORUS_SECTION_DIR = "marketing-video/hyperframes/world-cup-demo/assets/scenes";
const RENDER_ASSET_DIR = "marketing-video/hyperframes/world-cup-demo/assets/render";
const DURATION = 69;
const FPS = 30;
const CHECK_TIMESTAMPS = [
  0.2, 1.4, 2.5, 4.5, 7.5, 12.5, 13.4, 18.4, 21.2, 25.6, 27, 35, 45, 55, 67.5,
];
const DEFAULT_FFMPEG =
  "D:/DevTools/WeFlow/resources/app.asar.unpacked/node_modules/ffmpeg-static/ffmpeg.exe";

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

function requireFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing source file: ${filePath}`);
  }
}

function numberedPngs(dir, expectedCount) {
  const absoluteDir = path.resolve(dir);
  if (!existsSync(absoluteDir)) {
    throw new Error(`Missing asset directory: ${absoluteDir}`);
  }

  const files = readdirSync(absoluteDir)
    .filter((file) => /\.png$/i.test(file))
    .map((file) => {
      const match = file.match(/\((\d+)\)\.png$/i);
      if (!match) {
        throw new Error(`Image is missing a trailing number: ${path.join(dir, file)}`);
      }
      return { file, number: Number(match[1]) };
    })
    .sort((a, b) => a.number - b.number);

  if (files.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} PNGs in ${dir}, found ${files.length}`);
  }

  for (let index = 0; index < files.length; index += 1) {
    const expectedNumber = index + 1;
    if (files[index].number !== expectedNumber) {
      throw new Error(`Expected image (${expectedNumber}) in ${dir}, found (${files[index].number})`);
    }
  }

  return files.map(({ file }) => path.join(absoluteDir, file));
}

function copyNumberedAssets(sourceFiles, prefix, renderDir) {
  return sourceFiles.map((source, index) => {
    const fileName = `${prefix}-${String(index + 1).padStart(2, "0")}.png`;
    copyFileSync(source, path.join(renderDir, fileName));
    return fileName;
  });
}

function main() {
  requireFile(AUDIO_SOURCE);

  const firstSection = numberedPngs(FIRST_SECTION_DIR, 9);
  const countries = numberedPngs(COUNTRY_SECTION_DIR, 18);
  const chorusScenes = numberedPngs(CHORUS_SECTION_DIR, 8);

  const templateDir = path.resolve(TEMPLATE_DIR);
  const assetDir = path.join(templateDir, "assets");
  const renderDir = path.resolve(RENDER_ASSET_DIR);
  const checkDir = path.join(templateDir, "check-frames");
  const output = path.resolve(OUTPUT);
  const rawOutput = output.replace(/\.mp4$/i, ".raw.mp4");
  const ffmpeg = getFfmpegPath();
  const hyperframesBin = path.resolve("node_modules/.bin/hyperframes.CMD");

  mkdirSync(assetDir, { recursive: true });
  rmSync(renderDir, { recursive: true, force: true });
  mkdirSync(renderDir, { recursive: true });
  mkdirSync(checkDir, { recursive: true });
  mkdirSync(path.dirname(output), { recursive: true });

  copyFileSync(AUDIO_SOURCE, path.join(assetDir, "world-cup-fire.mp3"));
  copyNumberedAssets(firstSection, "intro", renderDir);
  copyNumberedAssets(countries, "country", renderDir);
  copyNumberedAssets(chorusScenes, "scene", renderDir);

  const binaryDirs = [path.dirname(ffmpeg), path.dirname(ffprobeStatic.path)].join(
    path.delimiter,
  );
  const env = {
    ...process.env,
    PATH: `${binaryDirs}${path.delimiter}${process.env.PATH ?? ""}`,
  };
  const runOptions = { env, shell: process.platform === "win32" };

  run(hyperframesBin, ["lint", templateDir], "HyperFrames lint", runOptions);
  run(
    hyperframesBin,
    [
      "render",
      templateDir,
      "--output",
      rawOutput,
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

  run(
    ffmpeg,
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      rawOutput,
      "-t",
      String(DURATION),
      "-r",
      String(FPS),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-ar",
      "48000",
      "-movflags",
      "+faststart",
      output,
    ],
    "FFmpeg final trim",
  );
  unlinkSync(rawOutput);

  for (const timestamp of CHECK_TIMESTAMPS) {
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

  console.log(`[world-cup-demo] video: ${output}`);
  console.log(`[world-cup-demo] check frames: ${checkDir}`);
}

main();
