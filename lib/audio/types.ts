export interface GenerateParams {
  prompt: string;
  lyrics: string;
  title: string;
  make_instrumental: boolean;
}

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
}

export interface AudioProvider {
  generateSong(params: GenerateParams): Promise<{ taskId: string }>;
  getTaskStatus(taskId: string): Promise<TaskResult>;
}
