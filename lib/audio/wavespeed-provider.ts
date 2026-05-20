import type { AudioProvider, GenerateParams, TaskResult } from "./types";

const DEFAULT_WAVESPEED_BASE_URL = "https://api.wavespeed.ai";
const DEFAULT_WAVESPEED_MODEL = "minimax/music-02";

class WavespeedError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "WavespeedError";
    this.status = status;
  }
}

function getWavespeedConfig() {
  const apiKey = process.env.WAVESPEED_API_KEY;

  if (!apiKey) {
    throw new WavespeedError("WAVESPEED_API_KEY is not configured");
  }

  return {
    apiKey,
    baseUrl: (
      process.env.WAVESPEED_API_BASE_URL ?? DEFAULT_WAVESPEED_BASE_URL
    ).replace(/\/$/, ""),
    model: process.env.WAVESPEED_MODEL ?? DEFAULT_WAVESPEED_MODEL,
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

    const body = await response.text().catch(() => "");
    throw new WavespeedError(
      body || `Wavespeed request failed with ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

function normalizeStatus(status?: string): TaskResult["status"] {
  const value = (status ?? "").toLowerCase();

  if (
    value === "completed" ||
    value === "succeeded" ||
    value === "success" ||
    value === "done"
  ) {
    return "completed";
  }

  if (
    value === "failed" ||
    value === "error" ||
    value === "cancelled" ||
    value === "canceled"
  ) {
    return "failed";
  }

  return "processing";
}

function extractAudioUrl(payload: unknown) {
  const data = payload as
    | {
        audio?: string;
        audio_url?: string;
        output?: unknown;
        outputs?: unknown;
        data?: unknown;
      }
    | undefined;

  if (typeof data?.audio === "string" && data.audio) {
    return data.audio;
  }

  if (typeof data?.audio_url === "string" && data.audio_url) {
    return data.audio_url;
  }

  const output = data?.output as
    | string
    | { audio?: string; audio_url?: string; url?: string }
    | undefined;
  if (typeof output === "string" && output) {
    return output;
  }
  if (output && typeof output === "object") {
    if (typeof output.audio === "string" && output.audio) {
      return output.audio;
    }
    if (typeof output.audio_url === "string" && output.audio_url) {
      return output.audio_url;
    }
    if (typeof output.url === "string" && output.url) {
      return output.url;
    }
  }

  const outputs = data?.outputs as
    | Array<string | { audio?: string; audio_url?: string; url?: string }>
    | undefined;
  if (Array.isArray(outputs)) {
    for (const item of outputs) {
      if (typeof item === "string" && item) {
        return item;
      }
      if (item && typeof item === "object") {
        if (typeof item.audio === "string" && item.audio) {
          return item.audio;
        }
        if (typeof item.audio_url === "string" && item.audio_url) {
          return item.audio_url;
        }
        if (typeof item.url === "string" && item.url) {
          return item.url;
        }
      }
    }
  }

  const nestedData = data?.data as
    | { audio?: string; audio_url?: string; url?: string }
    | undefined;
  if (nestedData) {
    if (typeof nestedData.audio === "string" && nestedData.audio) {
      return nestedData.audio;
    }
    if (typeof nestedData.audio_url === "string" && nestedData.audio_url) {
      return nestedData.audio_url;
    }
    if (typeof nestedData.url === "string" && nestedData.url) {
      return nestedData.url;
    }
  }

  return null;
}

export const wavespeedProvider: AudioProvider = {
  name: "wavespeed",
  creditCost: 100,
  expectedTrackCount: 1,

  async generateSong(params: GenerateParams) {
    const { apiKey, baseUrl, model } = getWavespeedConfig();

    const json = await requestWithRetry<{
      id?: string;
      requestId?: string;
      request_id?: string;
      status?: string;
      data?: {
        id?: string;
        requestId?: string;
        request_id?: string;
        status?: string;
      };
      message?: string;
      error?: string;
    }>(`${baseUrl}/api/v3/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `${params.prompt}\n\nLyrics:\n${params.lyrics}`,
        title: params.title,
        instrumental: params.make_instrumental,
      }),
    });

    const taskId =
      json.id ?? json.requestId ?? json.request_id ?? json.data?.id ?? json.data?.requestId ?? json.data?.request_id;

    if (!taskId) {
      throw new WavespeedError(
        json.message ?? json.error ?? "Wavespeed did not return request id",
      );
    }

    return {
      taskId,
      providerStatus: json.status ?? json.data?.status,
    };
  },

  async getTaskStatus(taskId: string) {
    const { apiKey, baseUrl } = getWavespeedConfig();

    const json = await requestWithRetry<{
      id?: string;
      status?: string;
      output?: unknown;
      outputs?: unknown;
      data?: unknown;
      error?: string;
      message?: string;
    }>(`${baseUrl}/api/v3/predictions/${encodeURIComponent(taskId)}/result`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const status = normalizeStatus(json.status);
    if (status === "processing") {
      return {
        status: "processing",
        songs: [],
        providerStatus: json.status,
      };
    }

    if (status === "failed") {
      return {
        status: "failed",
        songs: [],
        error: json.error ?? json.message ?? "Wavespeed task failed",
        providerStatus: json.status,
      };
    }

    const audioUrl = extractAudioUrl(json);
    if (!audioUrl) {
      return {
        status: "failed",
        songs: [],
        error: json.error ?? json.message ?? "Wavespeed result missing audio URL",
        providerStatus: json.status,
      };
    }

    return {
      status: "completed",
      songs: [
        {
          id: taskId,
          audio_url: audioUrl,
          duration: 0,
        },
      ],
      providerStatus: json.status,
    };
  },
};
