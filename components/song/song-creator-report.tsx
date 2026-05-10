import type { JudgeReport } from "@/types/judge";

interface SongCreatorReportProps {
  title: string;
  storySummary: string;
  genre: string;
  mood: string;
  bpm: number | null;
  styleTags: string[];
  totalScore: number | null;
  reportData: Record<string, unknown> | null;
  labels: {
    title: string;
    score: string;
    producerComment: string;
    emotionalValue: string;
    hookAnalysis: string;
    marketPositioning: string;
    songDetails: string;
    genre: string;
    mood: string;
    bpm: string;
    tags: string;
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

export function SongCreatorReport({
  title,
  storySummary,
  genre,
  mood,
  bpm,
  styleTags,
  totalScore,
  reportData,
  labels,
}: SongCreatorReportProps) {
  const report = isJudgeReport(reportData) ? reportData : null;
  const score = report?.total_score ?? totalScore;
  const details = [
    [labels.genre, genre],
    [labels.mood, mood],
    bpm ? [labels.bpm, `${bpm}`] : null,
    styleTags.length > 0 ? [labels.tags, styleTags.join(", ")] : null,
  ].filter((item): item is string[] => Boolean(item));

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

        <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          {typeof score === "number" ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-[#1ed760]">
                {labels.score}
              </p>
              <p className="mt-2 text-5xl font-black leading-none text-white">
                {score}
                <span className="ml-1 text-lg font-bold text-zinc-500">
                  /100
                </span>
              </p>
            </div>
          ) : null}

          <div className={score ? "mt-7" : undefined}>
            <h3 className="text-sm font-bold text-white">
              {labels.songDetails}
            </h3>
            <dl className="mt-4 space-y-3">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-bold uppercase tracking-normal text-zinc-500">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold leading-6 text-zinc-300">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </article>
  );
}
