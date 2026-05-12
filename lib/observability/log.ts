import { randomUUID } from "crypto";
import { ERROR_CODES, type ErrorCode } from "@/lib/observability/error-codes";

type LogLevel = "info" | "error";

export type LogPayload = {
  request_id?: string;
  user_id?: string | null;
  song_id?: string | null;
  stage?: string;
  status?: string;
  duration_ms?: number;
  error_code?: ErrorCode | string;
  [key: string]: unknown;
};

function emit(level: LogLevel, event: string, payload: LogPayload) {
  const line = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...payload,
  };

  const text = JSON.stringify(line);
  if (level === "error") {
    console.error(text);
    return;
  }
  console.info(text);
}

export function logInfo(event: string, payload: LogPayload = {}) {
  emit("info", event, payload);
}

export function logError(event: string, payload: LogPayload = {}) {
  emit("error", event, payload);
}

export function getRequestId(headerValue: string | null) {
  return headerValue?.trim() || randomUUID();
}

export function elapsedMs(startMs: number) {
  return Date.now() - startMs;
}

function toMessage(value: unknown) {
  if (value instanceof Error) {
    return value.message;
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function classifyProviderError(error: unknown): {
  error_code: ErrorCode;
  provider_error_code: string | null;
  provider_message: string;
} {
  const anyError = error as
    | {
        status?: number;
        code?: string;
        message?: string;
        response?: { status?: number; data?: unknown };
      }
    | undefined;

  const status = anyError?.status ?? anyError?.response?.status;
  const providerErrorCode =
    typeof anyError?.code === "string" ? anyError.code : null;
  const providerMessage = toMessage(anyError?.response?.data ?? error).slice(
    0,
    500,
  );

  if (providerErrorCode?.toLowerCase().includes("timeout")) {
    return {
      error_code: ERROR_CODES.TIMEOUT,
      provider_error_code: providerErrorCode,
      provider_message: providerMessage,
    };
  }

  if (status && status >= 400 && status < 500) {
    return {
      error_code: ERROR_CODES.PROVIDER_4XX,
      provider_error_code: providerErrorCode ?? String(status),
      provider_message: providerMessage,
    };
  }

  if (status && status >= 500) {
    return {
      error_code: ERROR_CODES.PROVIDER_5XX,
      provider_error_code: providerErrorCode ?? String(status),
      provider_message: providerMessage,
    };
  }

  return {
    error_code: ERROR_CODES.BAD_RESPONSE,
    provider_error_code: providerErrorCode,
    provider_message: providerMessage,
  };
}
