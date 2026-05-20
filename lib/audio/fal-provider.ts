import type { AudioProvider, GenerateParams, TaskResult } from "./types";
import { logError, logInfo } from "@/lib/observability/log";
import { fal } from "@fal-ai/client";

const DEFAULT_MODEL_ID = "fal-ai/minimax-music/v2";
const DEFAULT_QUEUE_BASE_URL = "https://queue.fal.run";

class FalError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "FalError";
    this.status = status;
    this.code = code;
  }
}

function getFalConfig() {
  const apiKey = process.env.FAL_API_KEY ?? process.env.FAL_KEY;
  if (!apiKey) {
    throw new FalError("FAL_API_KEY (or FAL_KEY) is not configured");
  }

  const modelId = process.env.FAL_MUSIC_MODEL_ID ?? DEFAULT_MODEL_ID;
  const queueBaseUrl = (
    process.env.FAL_QUEUE_BASE_URL ?? DEFAULT_QUEUE_BASE_URL
  ).replace(/\/$/, "");

  const webhookUrl =
    process.env.FAL_WEBHOOK_URL ??
    `${(process.env.BASE_URL ?? "").replace(/\/$/, "")}/api/webhooks/fal`;

  return { apiKey, modelId, queueBaseUrl, webhookUrl };
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
    throw new FalError(
      body || `FAL request failed with ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

function mapFalStatusToTask(status?: string): TaskResult["status"] {
  if (status === "COMPLETED" || status === "OK") {
    return "completed";
  }

  if (status === "IN_QUEUE" || status === "IN_PROGRESS") {
    return "processing";
  }

  return "failed";
}

function normalizeTrack(taskId: string, payload: unknown): TaskResult["songs"] {
  const data = payload as
    | {
        data?: {
          audio?: {
            url?: string;
          };
          image?: {
            url?: string;
          };
          duration?: number;
          title?: string;
        };
        audio?: {
          url?: string;
        };
        image?: {
          url?: string;
        };
        duration?: number;
        title?: string;
        response?: {
          audio?: {
            url?: string;
          };
          image?: {
            url?: string;
          };
          duration?: number;
          title?: string;
        };
      }
    | undefined;

  const audioUrl =
    data?.data?.audio?.url ?? data?.response?.audio?.url ?? data?.audio?.url;
  if (!audioUrl) {
    return [];
  }

  return [
    {
      id: taskId,
      audio_url: audioUrl,
      image_url:
        data?.data?.image?.url ??
        data?.response?.image?.url ??
        data?.image?.url,
      duration:
        data?.data?.duration ?? data?.response?.duration ?? data?.duration ?? 0,
      title: data?.data?.title ?? data?.response?.title ?? data?.title,
    },
  ];
}

type FalQueueStatusResult = {
  status?: string;
  response_url?: string;
  error?: string;
};

type FalQueueResponseResult = {
  status?: string;
  payload?: unknown;
  data?: unknown;
  response?: unknown;
  error?: string;
};

export const falProvider: AudioProvider = {
  name: "fal",

  async generateSong(params: GenerateParams) {
    const { apiKey, modelId, queueBaseUrl, webhookUrl } = getFalConfig();
    const url = `${queueBaseUrl}/${modelId}`;

    const json = await requestWithRetry<{
      request_id?: string;
      status?: string;
    }>(url, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt: params.prompt.slice(0, 500),
          lyrics_prompt: params.lyrics,
        },
        webhook_url: webhookUrl,
      }),
    });

    const taskId = json.request_id;
    if (!taskId) {
      throw new FalError("FAL did not return request_id");
    }

    return { taskId, providerStatus: json.status };
  },

  async getTaskStatus(taskId: string) {
    const { apiKey, modelId } = getFalConfig();
    fal.config({ credentials: apiKey });
    const basePollFields = { poll_function_name: "falProvider.getTaskStatus" as const, fal_endpoint_id: modelId, fal_request_id: taskId };

    logInfo("fal_provider_poll", { ...basePollFields, poll_step: "status", sdk_method: "fal.queue.status" });
    let statusData: FalQueueStatusResult;
    try {
      const s = await fal.queue.status(modelId, { requestId: taskId, logs: true });
      statusData = { status: s.status, response_url: (s as { response_url?: string }).response_url, error: (s as { error?: string }).error };
      logInfo("fal_provider_poll", { ...basePollFields, poll_step: "status", sdk_method: "fal.queue.status", response_status: 200 });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logError("fal_provider_poll", { ...basePollFields, poll_step: "status", sdk_method: "fal.queue.status", response_status: "error", response_body: msg.slice(0, 500) });
      throw e;
    }

    const mapped = mapFalStatusToTask(statusData.status);
    if (mapped === "processing") {
      return { status: "processing", songs: [], providerStatus: statusData.status };
    }
    if (mapped === "failed") {
      return { status: "failed", songs: [], error: statusData.error ?? "FAL task failed", providerStatus: statusData.status };
    }

    logInfo("fal_provider_poll", { ...basePollFields, poll_step: "result", sdk_method: "fal.queue.result" });
    let resultData: FalQueueResponseResult;
    try {
      const r = await fal.queue.result(modelId, { requestId: taskId });
      resultData = { status: (r as { status?: string }).status, payload: (r as { data?: unknown }).data ?? r, data: (r as { data?: unknown }).data, response: r, error: (r as { error?: string }).error };
      logInfo("fal_provider_poll", { ...basePollFields, poll_step: "result", sdk_method: "fal.queue.result", response_status: 200 });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logError("fal_provider_poll", { ...basePollFields, poll_step: "result", sdk_method: "fal.queue.result", response_status: "error", response_body: msg.slice(0, 500) });
      throw e;
    }

    const songs = normalizeTrack(taskId, resultData.payload ?? resultData.data ?? resultData.response ?? resultData);
    return {
      status: songs.length > 0 ? "completed" : "failed",
      songs,
      error: songs.length > 0 ? undefined : (resultData.error ?? "FAL result missing audio URL"),
      providerStatus: resultData.status ?? statusData.status,
    };
  },
};
