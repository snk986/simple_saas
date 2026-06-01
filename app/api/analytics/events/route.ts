import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isPropertiesPayloadSmall,
  isUserEventName,
  sanitizeUserEventProperties,
} from "@/lib/analytics/event-schema";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import {
  invalidJsonRequest,
  validationError,
} from "@/lib/api/errors";

const requestSchema = z.object({
  eventName: z.string().min(1).max(80),
  properties: z.record(z.unknown()).optional(),
  pathname: z.string().max(300).nullable().optional(),
  sessionId: z.string().max(120).nullable().optional(),
});

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return invalidJsonRequest();
  }

  const parsed = requestSchema.safeParse(payload);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  if (!isUserEventName(parsed.data.eventName)) {
    return NextResponse.json({ error: "Unsupported event" }, { status: 400 });
  }

  const properties = sanitizeUserEventProperties(parsed.data.properties);

  if (!isPropertiesPayloadSmall(properties)) {
    return NextResponse.json(
      { error: "Event properties too large" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: true, tracked: false });
  }

  const serviceRole = createServiceRoleClient();
  const { error } = await serviceRole.from("user_events").insert({
    user_id: user.id,
    event_name: parsed.data.eventName,
    properties,
    pathname: parsed.data.pathname ?? null,
    session_id: parsed.data.sessionId ?? null,
  });

  if (error) {
    return NextResponse.json({ success: true, tracked: false });
  }

  return NextResponse.json({ success: true, tracked: true });
}
