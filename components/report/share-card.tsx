import type { JudgeReport } from "@/types/judge";
import { cn } from "@/lib/utils";

interface ShareCardProps {
  title: string;
  coverUrl: string | null;
  styleTags: string[];
  report: JudgeReport;
  labels: {
    badge: string;
    totalScore: string;
    summary: string;
  };
  className?: string;
}

function getTopDimensions(report: JudgeReport) {
  return [...report.dimensions]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}

function formatDimensionName(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ShareCard({
  title,
  coverUrl,
  styleTags,
  report,
  labels,
  className,
}: ShareCardProps) {
  const topDimensions = getTopDimensions(report);

  return (
    <div
      className={cn(
        "aspect-[1200/630] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white shadow-sm",
        className,
      )}
    >
      <div className="grid h-full grid-cols-[0.92fr_1.08fr]">
        <div className="relative bg-slate-900">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900 text-6xl font-semibold text-slate-700">
              HS
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2">
            {styleTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-950"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex h-full flex-col justify-between p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-emerald-300">
              {labels.badge}
            </p>
            <h2 className="mt-4 line-clamp-2 text-4xl font-semibold leading-tight tracking-normal">
              {title}
            </h2>
          </div>

          <div>
            <div className="flex items-end gap-3">
              <span className="text-7xl font-semibold leading-none">
                {report.total_score}
              </span>
              <span className="pb-2 text-base font-medium text-slate-300">
                /100 {labels.totalScore}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {topDimensions.map((dimension) => (
                <div
                  key={dimension.dimension}
                  className="rounded-lg border border-white/10 bg-white/10 p-3"
                >
                  <p className="text-xs text-slate-300">
                    {formatDimensionName(dimension.dimension)}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {dimension.score}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg bg-white p-4 text-slate-950">
              <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                {labels.summary}
              </p>
              <p className="mt-2 line-clamp-3 text-sm leading-6">
                {report.share_summary}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
