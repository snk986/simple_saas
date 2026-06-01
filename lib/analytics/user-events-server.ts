import {
  isPropertiesPayloadSmall,
  isUserEventName,
  sanitizeUserEventProperties,
  type UserEventName,
  type UserEventProperties,
} from "@/lib/analytics/event-schema";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

const SERVER_EVENT_INSERT_TIMEOUT_MS = 750;

interface TrackServerUserEventInput {
  userId: string | null | undefined;
  eventName: UserEventName;
  properties?: UserEventProperties;
  pathname?: string | null;
  sessionId?: string | null;
}

interface UserEventRow {
  user_id: string;
  event_name: UserEventName;
  properties: UserEventProperties;
  pathname: string | null;
  session_id: string | null;
}

async function insertUserEventWithTimeout(row: UserEventRow) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const supabase = createServiceRoleClient();
    const insert = Promise.resolve(supabase.from("user_events").insert(row))
      .then(() => "inserted" as const, () => "failed" as const);
    const timer = new Promise<"timeout">((resolve) => {
      timeout = setTimeout(
        () => resolve("timeout"),
        SERVER_EVENT_INSERT_TIMEOUT_MS,
      );
    });

    await Promise.race([insert, timer]);
  } catch {
    // User behavior tracking must never block product flows.
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export function trackServerUserEvent({
  userId,
  eventName,
  properties = {},
  pathname,
  sessionId,
}: TrackServerUserEventInput) {
  if (!userId || !isUserEventName(eventName)) {
    return;
  }

  const safeProperties = sanitizeUserEventProperties(properties);

  if (!isPropertiesPayloadSmall(safeProperties)) {
    return;
  }

  void insertUserEventWithTimeout({
    user_id: userId,
    event_name: eventName,
    properties: safeProperties,
    pathname: pathname?.slice(0, 300) ?? null,
    session_id: sessionId?.slice(0, 120) ?? null,
  }).catch(() => undefined);
}
