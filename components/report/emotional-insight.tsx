import type { JudgeReport } from "@/types/judge";

interface EmotionalInsightProps {
  report: JudgeReport;
  labels: {
    title: string;
    subtitle: string;
  };
}

export function EmotionalInsight({ report, labels }: EmotionalInsightProps) {
  if (!report.emotional_mirror) {
    return null;
  }

  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-900/70 dark:bg-slate-950 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700 dark:text-emerald-300">
        {labels.subtitle}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
        {labels.title}
      </h2>
      <p className="mt-5 text-lg leading-9 text-slate-700 dark:text-slate-200">
        {report.emotional_mirror}
      </p>
    </section>
  );
}
