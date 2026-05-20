import type { AudioProvider, GenerateParams, TaskResult } from "./types";
import { logError, logInfo } from "@/lib/observability/log";
import { fal } from "@fal-ai/client";

const DEFAULT_MODEL_ID = "fal-ai/minimax-music/v2";

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
  const webhookUrl =
    process.env.FAL_WEBHOOK_URL ??
    `${(process.env.BASE_URL ?? "").replace(/\/$/, "")}/api/webhooks/fal`;

  return { apiKey, modelId, webhookUrl };
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

export const falProvider: AudioProvider = {
  name: "fal",

  async generateSong(params: GenerateParams) {
    const { apiKey, modelId, webhookUrl } = getFalConfig();
    fal.config({ credentials: apiKey });

    logInfo("fal_provider_submit", {
      submit_function_name: "falProvider.generateSong",
      fal_endpoint_id: modelId,
      sdk_method: "fal.queue.submit",
      status: "started",
    });

    let json: Awaited<ReturnType<typeof fal.queue.submit>>;
    try {
      json = await fal.queue.submit(modelId, {
        input: {
          prompt: params.prompt.slice(0, 500),
          lyrics_prompt: params.lyrics,
        },
        webhookUrl,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logError("fal_provider_submit", {
        submit_function_name: "falProvider.generateSong",
        fal_endpoint_id: modelId,
        sdk_method: "fal.queue.submit",
        status: "failed",
        response_body: msg.slice(0, 500),
      });
      throw e;
    }

    const taskId = json.request_id;
    if (!taskId) {
      throw new FalError("FAL did not return request_id");
    }

    logInfo("fal_provider_submit", {
      submit_function_name: "falProvider.generateSong",
      fal_endpoint_id: modelId,
      fal_request_id: taskId,
      sdk_method: "fal.queue.submit",
      status: "succeeded",
      provider_status: json.status,
    });

    return { taskId, providerStatus: json.status };
  },

  async getTaskStatus(taskId: string) {
    const { apiKey, modelId } = getFalConfig();
    fal.config({ credentials: apiKey });
    const basePollFields = {
      poll_function_name: "falProvider.getTaskStatus" as const,
      fal_endpoint_id: modelId,
      fal_request_id: taskId,
    };

    logInfo("fal_provider_poll", {
      ...basePollFields,
      poll_step: "status",
      sdk_method: "fal.queue.status",
    });
    let statusSdk: Awaited<ReturnType<typeof fal.queue.status>>;
    try {
      statusSdk = await fal.queue.status(modelId, {
        requestId: taskId,
        logs: true,
      });
      logInfo("fal_provider_poll", {
        ...basePollFields,
        poll_step: "status",
        sdk_method: "fal.queue.status",
        response_status: 200,
        provider_status: statusSdk.status,
        provider_queue_position: (statusSdk as { queue_position?: number })
          .queue_position,
        provider_response_url_exists: Boolean(
          (statusSdk as { response_url?: string }).response_url,
        ),
        provider_error: (statusSdk as { error?: string }).error,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logError("fal_provider_poll", {
        ...basePollFields,
        poll_step: "status",
        sdk_method: "fal.queue.status",
        response_status: "error",
        response_body: msg.slice(0, 500),
      });
      throw e;
    }

    const providerStatus = statusSdk.status;
    if (providerStatus === "IN_QUEUE" || providerStatus === "IN_PROGRESS") {
      return { status: "processing", songs: [], providerStatus };
    }
    if (providerStatus !== "COMPLETED" && providerStatus !== "OK") {
      return {
        status: "failed",
        songs: [],
        error:
          (statusSdk as { error?: string }).error ??
          `FAL task failed with status: ${providerStatus}`,
        providerStatus,
      };
    }

    let resultSdk: Awaited<ReturnType<typeof fal.queue.result>>;
    try {
      resultSdk = await fal.queue.result(modelId, {
        requestId: taskId,
      });
      logInfo("fal_provider_poll", {
        ...basePollFields,
        poll_step: "result",
        sdk_method: "fal.queue.result",
        response_status: 200,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logError("fal_provider_poll", {
        ...basePollFields,
        poll_step: "result",
        sdk_method: "fal.queue.result",
        response_status: "error",
        response_body: msg.slice(0, 500),
      });
      throw e;
    }

    const songs = normalizeTrack(
      taskId,
      (resultSdk as { data?: unknown }).data ?? resultSdk,
    );
    return {
      status: songs.length > 0 ? "completed" : "failed",
      songs,
      error:
        songs.length > 0
          ? undefined
          : ((resultSdk as { error?: string }).error ??
            "FAL result missing audio URL"),
      providerStatus:
        (resultSdk as { status?: string }).status ?? providerStatus,
    };
  },
};
