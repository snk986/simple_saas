import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { invalidJsonRequest, validationError } from "@/lib/api/errors";

const requestSchema = z.object({
  selectedAudio: z.enum(["primary", "alt"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const payload = await request.json().catch(() => null);

    if (!payload) {
      return invalidJsonRequest();
    }

    const body = requestSchema.safeParse(payload);

    if (!body.success) {
      return validationError(body.error);
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: song, error: fetchError } = await supabase
      .from("songs")
      .select("id,audio_url_alt")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    if (body.data.selectedAudio === "alt" && !song.audio_url_alt) {
      return NextResponse.json(
        { error: "Alternate audio not found" },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabase
      .from("songs")
      .update({
        selected_audio: body.data.selectedAudio,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Audio select error:", error);
    return NextResponse.json(
      { error: "Failed to select audio" },
      { status: 500 },
    );
  }
}
