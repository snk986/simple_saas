export interface GenerateParams {
  prompt: string;
  lyrics: string;
  title: string;
  make_instrumental: boolean;
}

export type AudioProviderName = "kie" | "fal" | "wavespeed";

export interface GeneratedTrack {
  id: string;
  audio_url: string;
  image_url?: string;
  duration: number;
  title?: string;
}

export interface TaskResult {
  status: "processing" | "completed" | "failed";
  songs: GeneratedTrack[];
  error?: string;
  providerStatus?: string;
}

export interface AudioProvider {
  readonly name: AudioProviderName;
  readonly creditCost: number;
  readonly expectedTrackCount: number;
  generateSong(params: GenerateParams): Promise<{ taskId: string; providerStatus?: string }>;
  getTaskStatus(taskId: string): Promise<TaskResult>;
}
