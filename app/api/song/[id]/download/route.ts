import { NextResponse } from "next/server";
import { getUserEntitlements } from "@/lib/subscription/entitlements";
import { createClient } from "@/utils/supabase/server";

function filenameFromTitle(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${slug || "calyra-ai-song"}.mp3`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entitlements = await getUserEntitlements(user.id);
    if (entitlements.plan === "free") {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }

    const { data: song, error: songError } = await supabase
      .from("songs")
      .select("id,title,status,audio_url")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (songError || !song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    if (song.status !== "ready" || !song.audio_url) {
      return NextResponse.json({ error: "Song is not ready" }, { status: 400 });
    }

    const audioResponse = await fetch(song.audio_url, { cache: "no-store" });
    if (!audioResponse.ok || !audioResponse.body) {
      return NextResponse.json(
        { error: "Failed to download song" },
        { status: 502 },
      );
    }

    const contentType =
      audioResponse.headers.get("content-type") ?? "audio/mpeg";
    const contentLength = audioResponse.headers.get("content-length");
    const filename = filenameFromTitle(song.title);
    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    });

    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new Response(audioResponse.body, { headers });
  } catch (error) {
    console.error("Song download error:", error);
    return NextResponse.json(
      { error: "Failed to download song" },
      { status: 500 },
    );
  }
}
