import type { JudgeReport, ScoreDimension } from "@/types/judge";
import { cn } from "@/lib/utils";

interface SongCreatorReportProps {
  reportData: Record<string, unknown> | null;
  labels: {
    score: string;
    dimensions: Record<ScoreDimension, string>;
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
  reportData,
  labels,
}: SongCreatorReportProps) {
  const report = isJudgeReport(reportData) ? reportData : null;

  if (!report) {
    return null;
  }

  const topDimensions = report.dimensions.slice(0, 4);

  return (
    <article className="mx-auto mt-12 w-full border-t border-white/10 px-2 pt-8 sm:px-4">
      <aside className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-5 py-5 sm:px-7">
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
    </article>
  );
}
