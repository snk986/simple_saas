export const USER_EVENT_NAMES = [
  "signup_submit",
  "signup_success",
  "sign_in_success",
  "auth_callback_completed",
  "generate_invalid_input",
  "generate_submit",
  "generate_auth_required",
  "generate_credit_required",
  "generate_request_created",
  "generate_audio_completed",
  "generate_audio_failed",
  "dashboard_viewed",
  "workspace_song_play_clicked",
  "public_song_play_started",
  "public_song_play_completed",
  "song_share_clicked",
  "song_report_clicked",
  "song_download_clicked",
  "pricing_viewed",
  "checkout_auth_required",
  "checkout_start",
  "checkout_redirect",
  "checkout_failed",
  "payment_return",
  "subscription_activated",
] as const;

export type UserEventName = (typeof USER_EVENT_NAMES)[number];

export type UserEventProperties = Record<
  string,
  string | number | boolean | null
>;

const USER_EVENT_NAME_SET = new Set<string>(USER_EVENT_NAMES);
const SAFE_PROPERTY_KEYS = new Set([
  "billing_period",
  "credit_cost",
  "event_type",
  "has_style",
  "instrumental",
  "locale",
  "manage_plan",
  "method",
  "mode",
  "pathname",
  "plan",
  "product_type",
  "provider",
  "provider_status",
  "route",
  "song_id",
  "status",
  "status_code",
  "style_key",
  "tier_id",
]);

export function isUserEventName(eventName: string): eventName is UserEventName {
  return USER_EVENT_NAME_SET.has(eventName);
}

export function sanitizeUserEventProperties(
  properties: Record<string, unknown> | null | undefined,
): UserEventProperties {
  if (!properties) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(properties).flatMap(([key, value]) => {
      if (!SAFE_PROPERTY_KEYS.has(key)) {
        return [];
      }

      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
      ) {
        return [[key, value]];
      }

      return [];
    }),
  );
}

export function isPropertiesPayloadSmall(properties: UserEventProperties) {
  return JSON.stringify(properties).length <= 4000;
}
