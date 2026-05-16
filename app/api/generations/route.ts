import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  mode: z.enum(["text", "lyrics"]).optional(),
  prompt: z.string().trim().min(10).max(2000),
  style: z.string().trim().max(300).optional(),
  title: z.string().trim().max(120).optional(),
  locale: z.string().trim().optional(),
});

function buildUserInput(input: z.infer<typeof requestSchema>) {
  const lines = [
    input.mode === "lyrics" ? "Mode: Lyrics to Song" : "Mode: Text to Song",
    input.title ? `Title: ${input.title}` : null,
    input.style ? `Style: ${input.style}` : null,
    `Prompt: ${input.prompt}`,
  ].filter(Boolean);

  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const origin = request.nextUrl.origin;
  const cookie = request.headers.get("cookie") ?? "";
  const locale = parsed.data.locale ?? "en";
  const userInput = buildUserInput(parsed.data);

  const lyricsResponse = await fetch(`${origin}/api/generate/lyrics`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
    },
    body: JSON.stringify({
      userInput,
      locale,
    }),
    cache: "no-store",
  });
  const lyricsData = await lyricsResponse.json();

  if (!lyricsResponse.ok) {
    return NextResponse.json(
      { error: lyricsData.error ?? "Generation failed" },
      { status: lyricsResponse.status },
    );
  }

  const audioResponse = await fetch(`${origin}/api/generate/audio`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
    },
    body: JSON.stringify({
      songId: lyricsData.songId,
      lyrics: lyricsData.lyrics,
    }),
    cache: "no-store",
  });
  const audioData = await audioResponse.json();

  if (!audioResponse.ok) {
    return NextResponse.json(
      { error: audioData.error ?? "Audio generation failed" },
      { status: audioResponse.status },
    );
  }

  return NextResponse.json({
    jobId: lyricsData.songId,
    songId: lyricsData.songId,
    taskId: audioData.taskId,
    status: "processing",
  });
}

