import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Lightbulb,
} from "lucide-react";
import type { BlogArticle as BlogArticleData } from "@/config/blog-articles";
import { Button } from "@/components/ui/button";
import { formatBlogDate } from "@/lib/blog/date";

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);

  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

        if (!match) return <span key={`${part}-${index}`}>{part}</span>;

        return (
          <Link
            key={`${match[2]}-${index}`}
            href={match[2]}
            className="font-bold text-primary underline-offset-4 hover:underline"
          >
            {match[1]}
          </Link>
        );
      })}
    </>
  );
}

function ArticleParagraphs({ paragraphs }: { paragraphs?: string[] }) {
  if (!paragraphs) return null;

  return paragraphs.map((paragraph) => (
    <p
      key={paragraph}
      className="text-base leading-8 text-slate-300 md:text-lg"
    >
      <InlineMarkdown text={paragraph} />
    </p>
  ));
}

export function BlogArticle({ article }: { article: BlogArticleData }) {
  return (
    <div className="min-h-screen bg-[#06070a] text-white">
      <section className="border-b border-white/10 bg-[#090a0e]">
        <div className="container px-4 py-10 md:px-6 md:py-16">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>

          <div className="mx-auto mt-10 max-w-4xl text-center">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-primary">
              <span>{article.category}</span>
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-normal text-white md:text-6xl">
              {article.title}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
              {article.excerpt}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {formatBlogDate(article.publishedAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {article.readingTime}
              </span>
              <span>By Calyra AI</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container grid gap-10 px-4 py-12 md:px-6 lg:grid-cols-[220px_minmax(0,760px)] lg:justify-center lg:gap-16 lg:py-16">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 rounded-lg border border-white/10 bg-white/[0.025] p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Table of contents
            </p>
            <ol className="mt-4 space-y-3">
              {article.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-sm leading-5 text-slate-400 transition hover:text-white"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#frequently-asked-questions"
                  className="text-sm leading-5 text-slate-400 transition hover:text-white"
                >
                  Frequently Asked Questions
                </a>
              </li>
            </ol>
          </nav>
        </aside>

        <article className="min-w-0">
          <div className="space-y-5">
            {article.intro.map((paragraph) => (
              <p
                key={paragraph}
                className="text-lg leading-8 text-slate-200 md:text-xl md:leading-9"
              >
                <InlineMarkdown text={paragraph} />
              </p>
            ))}
          </div>

          {article.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-24 border-b border-white/10 py-10"
            >
              <h2 className="text-3xl font-black leading-tight text-white">
                {section.title}
              </h2>
              <div className="mt-5 space-y-5">
                <ArticleParagraphs paragraphs={section.paragraphs} />

                {section.bullets && (
                  <ul className="space-y-3">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex gap-3 text-base leading-7 text-slate-300 md:text-lg"
                      >
                        <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                        <span>
                          <InlineMarkdown text={bullet} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.table && (
                  <div className="overflow-x-auto rounded-lg border border-white/10">
                    <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                      <thead className="bg-white/[0.045] text-slate-200">
                        <tr>
                          {section.table.columns.map((column) => (
                            <th
                              key={column}
                              className="border-b border-white/10 px-4 py-3 font-black"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row) => (
                          <tr
                            key={row.join("-")}
                            className="border-b border-white/10 last:border-b-0"
                          >
                            {row.map((cell) => (
                              <td
                                key={cell}
                                className="px-4 py-3 leading-6 text-slate-300"
                              >
                                <InlineMarkdown text={cell} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {section.steps && (
                  <ol className="space-y-4">
                    {section.steps.map((step, index) => (
                      <li
                        key={step.title}
                        className="rounded-lg border border-white/10 bg-white/[0.025] p-5"
                      >
                        <div className="flex gap-4">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-black text-primary-foreground">
                            {index + 1}
                          </span>
                          <div>
                            <h3 className="text-lg font-black text-white">
                              {step.title}
                            </h3>
                            <p className="mt-2 leading-7 text-slate-300">
                              <InlineMarkdown text={step.body} />
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {section.prompts && (
                  <div className="space-y-4">
                    {section.prompts.map((item) => (
                      <div
                        key={item.title}
                        className="overflow-hidden rounded-lg border border-white/10 bg-[#0b0c11]"
                      >
                        <p className="border-b border-white/10 px-5 py-3 text-sm font-bold text-primary">
                          {item.title}
                        </p>
                        <p className="px-5 py-4 font-mono text-sm leading-7 text-slate-300">
                          {item.prompt}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {section.note && (
                  <div className="flex gap-4 rounded-lg border border-primary/25 bg-primary/[0.06] p-5">
                    <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <h3 className="font-black text-white">
                        {section.note.title}
                      </h3>
                      <p className="mt-2 font-mono text-sm leading-7 text-slate-300">
                        <InlineMarkdown text={section.note.body} />
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          ))}

          <section
            id="frequently-asked-questions"
            className="scroll-mt-24 py-10"
          >
            <h2 className="text-3xl font-black leading-tight text-white">
              Frequently Asked Questions
            </h2>
            <div className="mt-6 space-y-3">
              {article.faq.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-lg border border-white/10 bg-white/[0.025] p-5"
                >
                  <summary className="cursor-pointer list-none pr-6 text-lg font-black text-white">
                    {item.question}
                  </summary>
                  <p className="mt-3 leading-7 text-slate-300">
                    <InlineMarkdown text={item.answer} />
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-primary/25 bg-primary/[0.05] p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
              {article.cta.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-white">
              {article.cta.title}
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
              {article.cta.description}
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href={article.cta.href}>
                {article.cta.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </section>

          <section className="py-12">
            <h2 className="text-2xl font-black text-white">
              Explore More Calyra AI Tools
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {article.relatedLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg border border-white/10 bg-white/[0.025] p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <h3 className="font-black text-white">{item.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
