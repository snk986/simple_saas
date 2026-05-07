import { NextRequest, NextResponse } from "next/server";
import { buildRecallEmail } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/provider";
import { getRecallCandidates } from "@/lib/recall/eligibility";
import { isRecallScenario } from "@/lib/recall/types";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import type {
  RecallCandidate,
  RecallRunStats,
  RecallScenario,
} from "@/lib/recall/types";

export const dynamic = "force-dynamic";

function getProvidedSecret(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }

  return (
    request.headers.get("x-cron-secret") ??
    request.nextUrl.searchParams.get("secret")
  );
}

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  return getProvidedSecret(request) === cronSecret;
}

async function logSentEmail(candidate: RecallCandidate) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("email_log").insert({
    user_id: candidate.userId,
    song_id: candidate.songId ?? null,
    email_type: candidate.scenario,
    status: "sent",
    metadata: candidate.metadata ?? {},
  });

  if (error) {
    throw error;
  }
}

async function sendRecallEmail(candidate: RecallCandidate) {
  const email = buildRecallEmail({
    locale: candidate.locale,
    scenario: candidate.scenario,
    songTitle: candidate.songTitle,
    ctaUrl: candidate.ctaUrl,
  });

  await sendEmail({
    to: candidate.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  await logSentEmail(candidate);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scenarioParam = request.nextUrl.searchParams.get("scenario");

  if (scenarioParam && !isRecallScenario(scenarioParam)) {
    return NextResponse.json({ error: "Invalid scenario" }, { status: 400 });
  }

  const scenario: RecallScenario | undefined =
    scenarioParam && isRecallScenario(scenarioParam) ? scenarioParam : undefined;

  try {
    const { candidates, skipped } = await getRecallCandidates(scenario);
    const stats: RecallRunStats = { sent: 0, skipped, failed: 0 };

    for (const candidate of candidates) {
      try {
        await sendRecallEmail(candidate);
        stats.sent += 1;
      } catch (error) {
        stats.failed += 1;
        console.error("Recall email failed:", {
          scenario: candidate.scenario,
          songId: candidate.songId ?? null,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Recall cron failed:", error);
    return NextResponse.json(
      { error: "Recall cron failed" },
      { status: 500 },
    );
  }
}
