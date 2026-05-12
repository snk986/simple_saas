import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeInput, generateLyrics } from "@/lib/ai/provider";
import { getSongStyle, matchSongStyle } from "@/config/styles";
import { locales, defaultLocale } from "@/config/i18n";
import { createClient } from "@/utils/supabase/server";
import {
  getSongExpiryForEntitlements,
  getUserEntitlements,
} from "@/lib/subscription/entitlements";
import {
  classifyProviderError,
  elapsedMs,
  getRequestId,
  logError,
  logInfo,
} from "@/lib/observability/log";

const requestSchema = z.object({
  userInput: z.string().trim().min(10).max(2000).optional(),
  locale: z.string().trim().optional(),
  songId: z.string().uuid().optional(),
  currentLyrics: z.string().trim().max(8000).optional(),
});

function normalizeLocale(locale?: string) {
  return locales.includes(locale as any) ? locale! : defaultLocale;
}

function isPreviewRuntime() {
  return process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production";
}

function errorDetail(error: unknown) {
  if (!isPreviewRuntime()) {
    return undefined;
  }

  return error instanceof Error ? error.message : String(error);
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request.headers.get("x-request-id"));
  const requestStart = Date.now();

  try {
    const body = requestSchema.safeParse(await request.json());

    if (!body.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logInfo("lyrics_start", {
      request_id: requestId,
      user_id: user.id,
      stage: "lyrics_start",
      status: "started",
    });

    const locale = normalizeLocale(body.data.locale);
    const entitlements = await getUserEntitlements(user.id);

    if (body.data.songId) {
      console.info("[lyrics] regenerating lyrics", {
        provider: process.env.AI_PROVIDER ?? "github",
        locale,
        songId: body.data.songId,
      });

      const { data: existingSong, error: fetchError } = await supabase
        .from("songs")
        .select(
          "id,user_input,lyrics,lyrics_regen_count,locale,user_id,is_public",
        )
        .eq("id", body.data.songId)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !existingSong) {
        return NextResponse.json({ error: "Song not found" }, { status: 404 });
      }

      if ((existingSong.lyrics_regen_count ?? 0) >= 10) {
        return NextResponse.json(
          { error: "Lyrics generation limit reached" },
          { status: 400 },
        );
      }

      const userInput = body.data.userInput ?? existingSong.user_input;
      const analysis = await analyzeInput(userInput, locale);

      if (analysis.flagged) {
        return NextResponse.json(
          { error: "Content flagged", reason: analysis.reason },
          { status: 400 },
        );
      }

      const style = getSongStyle(analysis.style_key);
      const draft = await generateLyrics({
        userInput,
        locale,
        analysis,
        style,
        previousLyrics: body.data.currentLyrics ?? existingSong.lyrics,
      });

      const nextRegenCount = (existingSong.lyrics_regen_count ?? 0) + 1;
      const { data: updatedSong, error: updateError } = await supabase
        .from("songs")
        .update({
          title: draft.title,
          lyrics: draft.lyrics,
          user_input: userInput,
          lyrics_regen_count: nextRegenCount,
          style_key: style.key,
          style_params: style.params,
          style_tags: style.tags,
          locale,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSong.id)
        .eq("user_id", user.id)
        .select("id,title,lyrics,style_key,style_params,style_tags")
        .single();

      if (updateError || !updatedSong) {
        logError("lyrics_failed", {
          request_id: requestId,
          user_id: user.id,
          song_id: existingSong.id,
          stage: "lyrics_end",
          status: "failed",
          duration_ms: elapsedMs(requestStart),
          error_code: "BAD_RESPONSE",
          failure_reason: "failed_to_update_song",
        });
        return NextResponse.json(
          { error: "Failed to update song" },
          { status: 500 },
        );
      }

      logInfo("lyrics_end", {
        request_id: requestId,
        user_id: user.id,
        song_id: updatedSong.id,
        stage: "lyrics_end",
        status: "succeeded",
        duration_ms: elapsedMs(requestStart),
      });

      return NextResponse.json({
        request_id: requestId,
        songId: updatedSong.id,
        title: updatedSong.title,
        lyrics: updatedSong.lyrics,
        style_key: updatedSong.style_key,
        style_params: updatedSong.style_params,
        style_tags: updatedSong.style_tags,
        lyrics_regen_count: nextRegenCount,
      });
    }

    if (!body.data.userInput) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    console.info("[lyrics] generating lyrics", {
      provider: process.env.AI_PROVIDER ?? "github",
      locale,
    });

    const analysis = await analyzeInput(body.data.userInput, locale);

    if (analysis.flagged) {
      return NextResponse.json(
        { error: "Content flagged", reason: analysis.reason },
        { status: 400 },
      );
    }

    const style =
      getSongStyle(analysis.style_key) ??
      matchSongStyle({
        emotion: analysis.emotion,
        theme: analysis.theme,
        story: body.data.userInput,
      });
    const draft = await generateLyrics({
      userInput: body.data.userInput,
      locale,
      analysis,
      style,
    });

    console.info("[lyrics] generated draft", {
      provider: process.env.AI_PROVIDER ?? "github",
      locale,
      style: style.key,
    });

    const { data: song, error: insertError } = await supabase
      .from("songs")
      .insert({
        user_id: user.id,
        title: draft.title,
        lyrics: draft.lyrics,
        user_input: body.data.userInput,
        style_key: style.key,
        style_params: style.params,
        style_tags: style.tags,
        locale,
        status: "draft",
        is_public: true,
        expires_at: getSongExpiryForEntitlements(entitlements),
      })
      .select("id,title,lyrics,style_key,style_params,style_tags")
      .single();

    if (insertError || !song) {
      logError("lyrics_failed", {
        request_id: requestId,
        user_id: user.id,
        stage: "lyrics_end",
        status: "failed",
        duration_ms: elapsedMs(requestStart),
        error_code: "BAD_RESPONSE",
        failure_reason: "failed_to_create_song",
      });
      return NextResponse.json(
        { error: "Failed to create song" },
        { status: 500 },
      );
    }

    logInfo("lyrics_end", {
      request_id: requestId,
      user_id: user.id,
      song_id: song.id,
      stage: "lyrics_end",
      status: "succeeded",
      duration_ms: elapsedMs(requestStart),
    });

    return NextResponse.json({
      request_id: requestId,
      songId: song.id,
      title: song.title,
      lyrics: song.lyrics,
      style_key: song.style_key,
      style_params: song.style_params,
      style_tags: song.style_tags,
      lyrics_regen_count: 1,
    });
  } catch (error) {
    const providerError = classifyProviderError(error);
    logError("lyrics_failed", {
      request_id: requestId,
      stage: "lyrics_end",
      status: "failed",
      duration_ms: elapsedMs(requestStart),
      error_code: providerError.error_code,
      provider_error_code: providerError.provider_error_code,
      provider_message: providerError.provider_message,
    });
    return NextResponse.json(
      {
        error: "Generation failed",
        detail: errorDetail(error),
      },
      { status: 500 },
    );
  }
}
