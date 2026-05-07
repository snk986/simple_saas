import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ReportActions } from "@/components/report/report-actions";
import { ProducerComment } from "@/components/report/producer-comment";
import { ReportSection } from "@/components/report/report-section";
import { ScoreDisplay } from "@/components/report/score-display";
import { ShareCard } from "@/components/report/share-card";
import { ShareCardExport } from "@/components/report/share-card-export";
import { defaultLocale, locales, type Locale } from "@/config/i18n";
import { createClient } from "@/utils/supabase/server";
import type { JudgeReport, ScoreDimension } from "@/types/judge";

interface ReportPageProps {
  params: Promise<{
    locale: Locale;
    id: string;
  }>;
}

export const metadata: Metadata = {
  title: "Song Report | Hit-Song",
  robots: {
    index: false,
    follow: false,
  },
};

function localePrefix(locale: Locale) {
  return locale === defaultLocale ? "" : `/${locale}`;
}

function publicSongHref(locale: Locale, id: string) {
  return `${localePrefix(locale)}/song/${id}`;
}

function isJudgeReport(value: unknown): value is JudgeReport {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as JudgeReport).total_score === "number" &&
    Array.isArray((value as JudgeReport).dimensions)
  );
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { locale, id } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const t = await getTranslations("report");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`${localePrefix(locale)}/sign-in`);
  }

  const { data: song, error } = await supabase
    .from("songs")
    .select(
      "id,title,status,is_public,cover_url,style_tags,style_params,total_score,report_data,created_at,user_id",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !song) {
    notFound();
  }

  const report = isJudgeReport(song.report_data) ? song.report_data : null;
  const dimensions: Record<ScoreDimension, string> = {
    melody_potential: t("dimensions.melody_potential"),
    lyric_quality: t("dimensions.lyric_quality"),
    emotional_resonance: t("dimensions.emotional_resonance"),
    commercial_appeal: t("dimensions.commercial_appeal"),
    originality: t("dimensions.originality"),
  };
  const styleParams = (song.style_params ?? {}) as Record<string, unknown>;
  const mood =
    typeof styleParams.mood === "string" && styleParams.mood.trim()
      ? styleParams.mood
      : null;
  const genre =
    typeof styleParams.genre === "string" && styleParams.genre.trim()
      ? styleParams.genre
      : null;

  return (
    <div className="bg-[#f8fafc] text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="container px-4 py-6 md:px-6 md:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-7">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
              <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <Badge className="bg-emerald-600 hover:bg-emerald-600">
                    {t("badge")}
                  </Badge>
                  <Badge variant="outline">{song.status}</Badge>
                  {genre ? <Badge variant="outline">{genre}</Badge> : null}
                  {mood ? <Badge variant="outline">{mood}</Badge> : null}
                </div>
                <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-normal sm:text-5xl">
                  {song.title}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {report
                    ? t("subtitleReady", {
                        date: formatDate(report.generated_at, locale),
                      })
                    : t("subtitleMissing")}
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                {song.cover_url ? (
                  <img
                    src={song.cover_url}
                    alt={t("coverAlt", { title: song.title })}
                    className="aspect-square h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                    {t("noCover")}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <ReportActions
                songId={song.id}
                publicHref={publicSongHref(locale, song.id)}
                hasReport={Boolean(report)}
              />
            </div>
          </section>

          {!report ? (
            <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-950">
              <h2 className="text-xl font-semibold">{t("emptyTitle")}</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                {t("emptyBody")}
              </p>
            </section>
          ) : (
            <>
              <ScoreDisplay
                report={report}
                labels={{
                  totalScore: t("totalScore"),
                  dimensions,
                }}
              />

              <ProducerComment
                report={report}
                labels={{
                  title: t("producer.title"),
                  strengths: t("producer.strengths"),
                  improvements: t("producer.improvements"),
                  nextSteps: t("producer.nextSteps"),
                }}
              />

              <div className="grid gap-6 lg:grid-cols-3">
                <ReportSection
                  title={t("sections.emotionalValue")}
                  body={report.emotional_value}
                />
                <ReportSection
                  title={t("sections.hookAnalysis")}
                  body={report.hook_analysis}
                />
                <ReportSection
                  title={t("sections.marketPositioning")}
                  body={report.market_positioning}
                />
              </div>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold">{t("shareSummary")}</h2>
                  <ShareCardExport
                    songId={song.id}
                    title={song.title}
                    publicHref={publicSongHref(locale, song.id)}
                  />
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {report.share_summary}
                </p>
                <div className="mt-5">
                  <ShareCard
                    title={song.title}
                    coverUrl={song.cover_url}
                    styleTags={song.style_tags ?? []}
                    report={report}
                    labels={{
                      badge: t("badge"),
                      totalScore: t("totalScore"),
                      summary: t("shareSummary"),
                    }}
                  />
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
