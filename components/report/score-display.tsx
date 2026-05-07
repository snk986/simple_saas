import type { JudgeReport, ScoreDimension } from "@/types/judge";
import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  report: JudgeReport;
  labels: {
    totalScore: string;
    dimensions: Record<ScoreDimension, string>;
  };
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

export function ScoreDisplay({ report, labels }: ScoreDisplayProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-600 dark:text-emerald-400">
            {labels.totalScore}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-6xl font-semibold leading-none text-slate-950 dark:text-white">
              {report.total_score}
            </span>
            <span className="text-lg font-medium text-slate-500 dark:text-slate-400">
              /100
            </span>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 sm:max-w-[260px]">
          <div
            className={cn(
              "h-full rounded-full transition-[width]",
              scoreTone(report.total_score),
            )}
            style={{ width: `${report.total_score}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {report.dimensions.map((dimension) => (
          <div key={dimension.dimension}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-950 dark:text-white">
                  {labels.dimensions[dimension.dimension]}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {dimension.comment}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-slate-950 dark:text-white">
                {dimension.score}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
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
    </section>
  );
}
