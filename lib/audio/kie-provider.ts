import type { AudioProvider, GenerateParams, TaskResult } from "./types";

const DEFAULT_KIE_BASE_URL = "https://api.kie.ai";
const DEFAULT_MODEL = "V3_5";

class KieError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KieError";
  }
}

function getKieConfig() {
  const apiKey = process.env.KIE_API_KEY;

  if (!apiKey) {
    throw new KieError("KIE_API_KEY is not configured");
  }

  return {
    apiKey,
    baseUrl: (process.env.KIE_API_BASE_URL ?? DEFAULT_KIE_BASE_URL).replace(
      /\/$/,
      "",
    ),
    model: process.env.KIE_MODEL ?? DEFAULT_MODEL,
  };
}

async function requestWithRetry<T>(
  url: string,
  init: RequestInit,
  attempt = 0,
): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    if (attempt === 0 && response.status >= 500) {
      return requestWithRetry<T>(url, init, attempt + 1);
    }

    throw new KieError(`KIE request failed with ${response.status}`);
  }

  const json = (await response.json()) as { code?: number; msg?: string } & T;

  if (json.code && json.code !== 200) {
    throw new KieError(json.msg ?? `KIE returned code ${json.code}`);
  }

  return json;
}

function normalizeStatus(status?: string): TaskResult["status"] {
  if (status === "SUCCESS") {
    return "completed";
  }

  if (
    status === "CREATE_TASK_FAILED" ||
    status === "GENERATE_AUDIO_FAILED" ||
    status === "CALLBACK_EXCEPTION" ||
    status === "SENSITIVE_WORD_ERROR"
  ) {
    return "failed";
  }

  return "processing";
}

export const kieProvider: AudioProvider = {
  async generateSong(params: GenerateParams) {
    const { apiKey, baseUrl, model } = getKieConfig();
    const style = params.prompt.slice(0, model.startsWith("V3") ? 200 : 1000);

    const json = await requestWithRetry<{
      data?: { taskId?: string };
    }>(`${baseUrl}/api/v1/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        prompt: params.lyrics,
        style,
        title: params.title.slice(0, 80),
        customMode: true,
        instrumental: params.make_instrumental,
        model,
      }),
    });

    const taskId = json.data?.taskId;

    if (!taskId) {
      throw new KieError("KIE did not return a taskId");
    }

    return { taskId };
  },

  async getTaskStatus(taskId: string) {
    const { apiKey, baseUrl } = getKieConfig();
    const json = await requestWithRetry<{
      data?: {
        status?: string;
        errorMessage?: string | null;
        response?: {
          sunoData?: Array<{
            id?: string;
            audioUrl?: string;
            imageUrl?: string;
            duration?: number;
            title?: string;
          }>;
        };
      };
    }>(
      `${baseUrl}/api/v1/generate/record-info?taskId=${encodeURIComponent(
        taskId,
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    const status = normalizeStatus(json.data?.status);
    const songs =
      json.data?.response?.sunoData
        ?.filter((song) => song.audioUrl)
        .map((song, index) => ({
          id: song.id ?? `${taskId}-${index}`,
          audio_url: song.audioUrl!,
          image_url: song.imageUrl,
          duration: song.duration ?? 0,
          title: song.title,
        })) ?? [];

    return {
      status,
      songs,
      error: json.data?.errorMessage ?? undefined,
    };
  },
};
