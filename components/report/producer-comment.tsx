import type { JudgeReport } from "@/types/judge";

interface ProducerCommentProps {
  report: JudgeReport;
  labels: {
    title: string;
    strengths: string;
    improvements: string;
    nextSteps: string;
  };
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600 dark:bg-slate-900 dark:text-slate-300"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProducerComment({ report, labels }: ProducerCommentProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
        {labels.title}
      </h2>
      <p className="mt-4 text-base leading-8 text-slate-700 dark:text-slate-200">
        {report.producer_comment}
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <ListBlock title={labels.strengths} items={report.strengths} />
        <ListBlock title={labels.improvements} items={report.improvements} />
        <ListBlock
          title={labels.nextSteps}
          items={report.recommended_next_steps}
        />
      </div>
    </section>
  );
}
