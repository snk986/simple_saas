import { track } from "@vercel/analytics/server";

type FunnelProperties = Record<string, string | number | boolean | null>;
type TrackOptions = Parameters<typeof track>[2];

export async function trackServerFunnelEvent(
  eventName: string,
  properties: FunnelProperties = {},
  options?: TrackOptions,
) {
  try {
    await track(eventName, properties, options);
  } catch {
    // Analytics must never block auth, generation, or payment handling.
  }
}
