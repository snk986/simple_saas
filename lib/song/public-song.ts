import { cache } from "react";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { getSongStyle } from "@/config/styles";

export interface PublicSong {
  id: string;
  title: string;
  lyrics: string;
  lyricsPreview: string;
  storySummary: string;
  audioUrl: string;
  coverUrl: string | null;
  styleKey: string;
  styleLabel: string;
  styleTags: string[];
  genre: string;
  mood: string;
  bpm: number | null;
  locale: string;
  totalScore: number | null;
  reportData: Record<string, unknown> | null;
  playCount: number;
  completeCount: number;
  shareCount: number;
  ctaClickCount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface RelatedSong {
  id: string;
  title: string;
  coverUrl: string | null;
  styleLabel: string;
  mood: string;
  playCount: number;
}

type RawSong = {
  id: string;
  user_id: string;
  title: string;
  lyrics: string;
  user_input: string;
  audio_url: string | null;
  audio_url_alt: string | null;
  selected_audio: "primary" | "alt" | null;
  cover_url: string | null;
  style_key: string;
  style_params: {
    genre?: string;
    bpm?: number;
    mood?: string;
  } | null;
  style_tags: string[] | null;
  locale: string;
  total_score: number | null;
  report_data: Record<string, unknown> | null;
  play_count: number | null;
  complete_count: number | null;
  share_count: number | null;
  cta_click_count?: number | null;
  created_at: string;
  updated_at: string;
};

const publicProjection = `
  id,
  user_id,
  title,
  lyrics,
  user_input,
  audio_url,
  audio_url_alt,
  selected_audio,
  cover_url,
  style_key,
  style_params,
  style_tags,
  locale,
  total_score,
  report_data,
  play_count,
  complete_count,
  share_count,
  cta_click_count,
  created_at,
  updated_at
`;

function compactText(value: string, maxLength: number) {
  const text = value.replace(/\s+/g, " ").trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function makeLyricsPreview(lyrics: string) {
  return lyrics
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join("\n\n");
}

function mapPublicSong(song: RawSong): PublicSong | null {
  const audioUrl =
    song.selected_audio === "alt" && song.audio_url_alt
      ? song.audio_url_alt
      : song.audio_url;

  if (!audioUrl) {
    return null;
  }

  const style = getSongStyle(song.style_key);
  const styleParams = song.style_params ?? {};

  return {
    id: song.id,
    title: song.title,
    lyrics: song.lyrics,
    lyricsPreview: makeLyricsPreview(song.lyrics),
    storySummary: compactText(song.user_input, 220),
    audioUrl,
    coverUrl: song.cover_url,
    styleKey: song.style_key,
    styleLabel: style.label,
    styleTags: song.style_tags ?? style.tags,
    genre: styleParams.genre ?? style.params.genre,
    mood: styleParams.mood ?? style.params.mood,
    bpm: typeof styleParams.bpm === "number" ? styleParams.bpm : style.params.bpm,
    locale: song.locale,
    totalScore: song.total_score,
    reportData: song.report_data,
    playCount: song.play_count ?? 0,
    completeCount: song.complete_count ?? 0,
    shareCount: song.share_count ?? 0,
    ctaClickCount: song.cta_click_count ?? 0,
    createdAt: song.created_at,
    updatedAt: song.updated_at,
    userId: song.user_id,
  };
}

export const getPublicSong = cache(async (id: string) => {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("songs")
    .select(publicProjection)
    .eq("id", id)
    .eq("is_public", true)
    .eq("status", "ready")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .single();

  if (error || !data) {
    return null;
  }

  return mapPublicSong(data as RawSong);
});

export async function getRelatedPublicSongs(song: PublicSong, limit = 3) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("songs")
    .select(
      "id,title,cover_url,style_key,style_params,play_count,audio_url,audio_url_alt,selected_audio",
    )
    .eq("is_public", true)
    .eq("status", "ready")
    .neq("id", song.id)
    .contains("style_tags", song.styleTags.slice(0, 1))
    .order("play_count", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data
    .filter((item) => {
      const audioUrl =
        item.selected_audio === "alt" && item.audio_url_alt
          ? item.audio_url_alt
          : item.audio_url;
      return Boolean(audioUrl);
    })
    .map((item) => {
      const style = getSongStyle(item.style_key);
      const styleParams = item.style_params as { mood?: string } | null;

      return {
        id: item.id,
        title: item.title,
        coverUrl: item.cover_url,
        styleLabel: style.label,
        mood: styleParams?.mood ?? style.params.mood,
        playCount: item.play_count ?? 0,
      } satisfies RelatedSong;
    });
}

export async function getPublicSongsForSitemap() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("songs")
    .select("id,locale,updated_at")
    .eq("is_public", true)
    .eq("status", "ready")
    .not("audio_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(5000);

  if (error || !data) {
    return [];
  }

  return data;
}
