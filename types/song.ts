export type SongStatus = "draft" | "generating" | "ready" | "failed";
export type SelectedAudio = "primary" | "alt";

export interface Song {
  id: string;
  user_id: string;
  title: string;
  lyrics: string;
  user_input: string;
  audio_url: string | null;
  audio_url_alt: string | null;
  selected_audio: SelectedAudio;
  cover_url: string | null;
  lyrics_regen_count: number;
  style_key: string;
  style_params: StyleParams;
  style_tags: string[];
  locale: string;
  status: SongStatus;
  is_public: boolean;
  total_score: number | null;
  report_data: Record<string, unknown> | null;
  kie_task_id: string | null;
  play_count: number;
  complete_count: number;
  share_count: number;
  like_count: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StyleParams {
  genre: string;
  bpm: number;
  instruments: string[];
  vocals: string;
  mood: string;
}

export interface CreateSongInput {
  user_input: string;
  locale?: string;
}

export interface GenerateLyricsResponse {
  songId: string;
  lyrics: string;
  title: string;
  style_key: string;
  style_params: StyleParams;
  style_tags: string[];
  lyrics_regen_count: number;
}

export interface GenerateAudioResponse {
  taskId: string;
  songId: string;
}

export interface AudioStatusResponse {
  status: "processing" | "completed" | "failed";
  songId?: string;
  audio_url?: string;
  audio_url_alt?: string;
  cover_url?: string;
}
