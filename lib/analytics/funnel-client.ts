"use client";

import { track } from "@vercel/analytics";

type FunnelProperties = Record<string, string | number | boolean | null>;

export function trackFunnelEvent(
  eventName: string,
  properties: FunnelProperties = {},
) {
  try {
    track(eventName, properties);
  } catch {
    // Analytics must never block the user flow.
  }
}
