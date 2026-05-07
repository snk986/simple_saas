import "server-only";

import { absoluteLocaleUrl } from "@/lib/i18n/urls";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import type { RecallCandidate, RecallScenario } from "@/lib/recall/types";

type RecallCandidateDraft = Omit<RecallCandidate, "email">;

type SongCandidate = {
  id: string;
  user_id: string;
  title: string;
  locale: string | null;
  created_at: string;
  updated_at: string;
};

type CustomerContact = {
  user_id: string;
  email: string | null;
};

const MAX_CANDIDATES_PER_RUN = 100;
const QUERY_LIMIT = 400;
const FREQUENCY_DAYS = 7;

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function normalizeLocale(locale: string | null): Locale {
  return locale && isLocale(locale) ? locale : defaultLocale;
}

function appendUtm(url: string, scenario: RecallScenario, songId?: string) {
  const recallUrl = new URL(url);
  recallUrl.searchParams.set("utm_source", "email");
  recallUrl.searchParams.set("utm_medium", "recall");
  recallUrl.searchParams.set("utm_campaign", scenario);

  if (songId) {
    recallUrl.searchParams.set("song_id", songId);
  }

  return recallUrl.toString();
}

function songCtaUrl(song: SongCandidate, scenario: RecallScenario) {
  const locale = normalizeLocale(song.locale);
  const paths: Record<RecallScenario, string> = {
    draft_no_audio: `/create?ref=song&id=${encodeURIComponent(song.id)}`,
    ready_no_report: `/report/${song.id}`,
    report_no_share: `/song/${song.id}`,
    inactive_creator: "/create",
  };

  return appendUtm(absoluteLocaleUrl(locale, paths[scenario]), scenario, song.id);
}

function inactiveCtaUrl(locale: Locale) {
  return appendUtm(absoluteLocaleUrl(locale, "/create"), "inactive_creator");
}

async function fetchCustomers(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, CustomerContact>();
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("customers")
    .select("user_id,email")
    .in("user_id", userIds);

  if (error || !data) {
    throw error ?? new Error("Failed to load recall contacts");
  }

  return new Map(
    (data as CustomerContact[])
      .filter((customer) => customer.email)
      .map((customer) => [customer.user_id, customer]),
  );
}

async function fetchRecentEmailKeys(
  userIds: string[],
  scenarios: RecallScenario[],
) {
  if (userIds.length === 0 || scenarios.length === 0) {
    return new Set<string>();
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("email_log")
    .select("user_id,email_type")
    .in("user_id", userIds)
    .in("email_type", scenarios)
    .gte("sent_at", daysAgo(FREQUENCY_DAYS));

  if (error || !data) {
    throw error ?? new Error("Failed to load email frequency log");
  }

  return new Set(
    (data as Array<{ user_id: string; email_type: string }>).map(
      (log) => `${log.user_id}:${log.email_type}`,
    ),
  );
}

function dedupeCandidates(candidates: RecallCandidateDraft[]) {
  const seen = new Set<string>();
  const deduped: RecallCandidateDraft[] = [];

  for (const candidate of candidates) {
    const key = `${candidate.userId}:${candidate.scenario}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(candidate);
  }

  return deduped;
}

async function draftNoAudioCandidates() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("songs")
    .select("id,user_id,title,locale,created_at,updated_at")
    .eq("status", "draft")
    .is("audio_url", null)
    .lte("created_at", hoursAgo(6))
    .order("created_at", { ascending: true })
    .limit(QUERY_LIMIT);

  if (error || !data) {
    throw error ?? new Error("Failed to load draft recall candidates");
  }

  return (data as SongCandidate[]).map((song) => ({
    userId: song.user_id,
    locale: normalizeLocale(song.locale),
    scenario: "draft_no_audio" as const,
    songId: song.id,
    songTitle: song.title,
    ctaUrl: songCtaUrl(song, "draft_no_audio"),
    metadata: { songStatus: "draft" },
  }));
}

async function readyNoReportCandidates() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("songs")
    .select("id,user_id,title,locale,created_at,updated_at")
    .eq("status", "ready")
    .is("report_data", null)
    .lte("updated_at", hoursAgo(12))
    .order("updated_at", { ascending: true })
    .limit(QUERY_LIMIT);

  if (error || !data) {
    throw error ?? new Error("Failed to load report recall candidates");
  }

  return (data as SongCandidate[]).map((song) => ({
    userId: song.user_id,
    locale: normalizeLocale(song.locale),
    scenario: "ready_no_report" as const,
    songId: song.id,
    songTitle: song.title,
    ctaUrl: songCtaUrl(song, "ready_no_report"),
    metadata: { songStatus: "ready" },
  }));
}

async function reportNoShareCandidates() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("songs")
    .select("id,user_id,title,locale,created_at,updated_at")
    .eq("status", "ready")
    .not("report_data", "is", null)
    .eq("share_count", 0)
    .lte("updated_at", hoursAgo(24))
    .order("updated_at", { ascending: true })
    .limit(QUERY_LIMIT);

  if (error || !data) {
    throw error ?? new Error("Failed to load share recall candidates");
  }

  return (data as SongCandidate[]).map((song) => ({
    userId: song.user_id,
    locale: normalizeLocale(song.locale),
    scenario: "report_no_share" as const,
    songId: song.id,
    songTitle: song.title,
    ctaUrl: songCtaUrl(song, "report_no_share"),
    metadata: { shareCount: 0 },
  }));
}

async function inactiveCreatorCandidates() {
  const supabase = createServiceRoleClient();
  const recentSince = daysAgo(7);
  const [{ data: recentSongs, error: recentError }, { data: readySongs, error: readyError }] =
    await Promise.all([
      supabase.from("songs").select("user_id").gte("created_at", recentSince).limit(2000),
      supabase
        .from("songs")
        .select("id,user_id,title,locale,created_at,updated_at")
        .eq("status", "ready")
        .lte("created_at", recentSince)
        .order("updated_at", { ascending: false })
        .limit(QUERY_LIMIT),
    ]);

  if (recentError || readyError || !recentSongs || !readySongs) {
    throw recentError ?? readyError ?? new Error("Failed to load inactive creators");
  }

  const recentlyActiveUsers = new Set(
    (recentSongs as Array<{ user_id: string }>).map((song) => song.user_id),
  );
  const latestReadyByUser = new Map<string, SongCandidate>();

  for (const song of readySongs as SongCandidate[]) {
    if (!recentlyActiveUsers.has(song.user_id) && !latestReadyByUser.has(song.user_id)) {
      latestReadyByUser.set(song.user_id, song);
    }
  }

  return Array.from(latestReadyByUser.values()).map((song) => {
    const locale = normalizeLocale(song.locale);

    return {
      userId: song.user_id,
      locale,
      scenario: "inactive_creator" as const,
      songId: song.id,
      songTitle: song.title,
      ctaUrl: inactiveCtaUrl(locale),
      metadata: { lastReadySongId: song.id },
    };
  });
}

async function loadScenarioCandidates(scenario: RecallScenario) {
  if (scenario === "draft_no_audio") {
    return draftNoAudioCandidates();
  }

  if (scenario === "ready_no_report") {
    return readyNoReportCandidates();
  }

  if (scenario === "report_no_share") {
    return reportNoShareCandidates();
  }

  return inactiveCreatorCandidates();
}

export async function getRecallCandidates(scenario?: RecallScenario) {
  const scenarios: RecallScenario[] = scenario
    ? [scenario]
    : ["draft_no_audio", "ready_no_report", "report_no_share", "inactive_creator"];
  const rawCandidates = (
    await Promise.all(scenarios.map((item) => loadScenarioCandidates(item)))
  ).flat();
  const dedupedCandidates = dedupeCandidates(rawCandidates);
  const userIds = Array.from(new Set(dedupedCandidates.map((candidate) => candidate.userId)));
  const [customers, recentEmailKeys] = await Promise.all([
    fetchCustomers(userIds),
    fetchRecentEmailKeys(userIds, scenarios),
  ]);

  let skipped = 0;
  const candidates: RecallCandidate[] = [];

  for (const candidate of dedupedCandidates) {
    const contact = customers.get(candidate.userId);
    const alreadySent = recentEmailKeys.has(`${candidate.userId}:${candidate.scenario}`);

    if (!contact?.email || alreadySent) {
      skipped += 1;
      continue;
    }

    candidates.push({
      ...candidate,
      email: contact.email,
    });

    if (candidates.length >= MAX_CANDIDATES_PER_RUN) {
      skipped += dedupedCandidates.length - skipped - candidates.length;
      break;
    }
  }

  return { candidates, skipped };
}
