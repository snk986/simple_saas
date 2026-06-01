"use client";

import { track } from "@vercel/analytics";
import {
  isUserEventName,
  sanitizeUserEventProperties,
} from "@/lib/analytics/event-schema";

type FunnelProperties = Record<string, string | number | boolean | null>;
const SESSION_STORAGE_KEY = "calyra:user-event-session-id";

function getUserEventSessionId() {
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (existing) {
      return existing;
    }

    const next =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, next);
    return next;
  } catch {
    return null;
  }
}

function trackSupabaseUserEvent(
  eventName: string,
  properties: FunnelProperties,
) {
  if (typeof window === "undefined") {
    return;
  }

  if (!isUserEventName(eventName)) {
    return;
  }

  try {
    const body = JSON.stringify({
      eventName,
      properties: sanitizeUserEventProperties(properties),
      pathname: window.location.pathname,
      sessionId: getUserEventSessionId(),
    });

    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // User behavior tracking must never block the user flow.
  }
}

export function trackFunnelEvent(
  eventName: string,
  properties: FunnelProperties = {},
) {
  try {
    track(eventName, properties);
  } catch {
    // Analytics must never block the user flow.
  }

  trackSupabaseUserEvent(eventName, properties);
}
