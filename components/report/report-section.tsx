interface ReportSectionProps {
  title: string;
  body: string;
}

export function ReportSection({ title, body }: ReportSectionProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <h2 className="text-base font-semibold text-slate-950 dark:text-white">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
        {body}
      </p>
    </section>
  );
}
