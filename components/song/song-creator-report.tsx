import type { JudgeReport, ScoreDimension } from "@/types/judge";
import { cn } from "@/lib/utils";

interface SongCreatorReportProps {
  title: string;
  storySummary: string;
  reportData: Record<string, unknown> | null;
  labels: {
    title: string;
    score: string;
    producerComment: string;
    emotionalValue: string;
    hookAnalysis: string;
    marketPositioning: string;
    dimensions: Record<ScoreDimension, string>;
    fallbackIntro: string;
  };
}

function isJudgeReport(value: unknown): value is JudgeReport {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as JudgeReport).total_score === "number" &&
    Array.isArray((value as JudgeReport).dimensions)
  );
}

function TextBlock({ title, body }: { title: string; body?: string }) {
  if (!body) {
    return null;
  }

  return (
    <section>
      <h3 className="text-base font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-7 text-zinc-400">{body}</p>
    </section>
  );
}

function scoreTone(score: number) {
  if (score >= 85) {
    return "bg-emerald-500";
  }

  if (score >= 70) {
    return "bg-sky-500";
  }

  if (score >= 55) {
    return "bg-amber-500";
  }

  return "bg-rose-500";
}

export function SongCreatorReport({
  title,
  storySummary,
  reportData,
  labels,
}: SongCreatorReportProps) {
  const report = isJudgeReport(reportData) ? reportData : null;
  const topDimensions = report ? report.dimensions.slice(0, 4) : [];

  return (
    <article className="mt-12 max-w-5xl border-t border-white/10 pt-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <h2 className="text-2xl font-extrabold tracking-normal text-white">
            {labels.title}
          </h2>
          <p className="mt-4 text-base font-medium leading-8 text-zinc-400">
            {report?.share_summary ??
              labels.fallbackIntro
                .replace("{title}", title)
                .replace("{story}", storySummary)}
          </p>

          <div className="mt-8 grid gap-7">
            <TextBlock
              title={labels.producerComment}
              body={report?.producer_comment}
            />
            <TextBlock
              title={labels.emotionalValue}
              body={report?.emotional_value}
            />
            <TextBlock
              title={labels.hookAnalysis}
              body={report?.hook_analysis}
            />
            <TextBlock
              title={labels.marketPositioning}
              body={report?.market_positioning}
            />
          </div>
        </div>

        {report ? (
          <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-[#1ed760]">
                {labels.score}
              </p>
              <p className="mt-2 text-5xl font-black leading-none text-white">
                {report.total_score}
                <span className="ml-1 text-lg font-bold text-zinc-500">/100</span>
              </p>
            </div>

            <div className="mt-6 grid gap-4">
              {topDimensions.map((dimension) => (
                <div key={dimension.dimension}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {labels.dimensions[dimension.dimension]}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">
                        {dimension.comment}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-white">
                      {dimension.score}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width]",
                        scoreTone(dimension.score),
                      )}
                      style={{ width: `${dimension.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </article>
  );
}
