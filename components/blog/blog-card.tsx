import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import type { BlogArticle } from "@/config/blog-articles";

export function BlogCard({ article }: { article: BlogArticle }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.025] transition hover:border-white/20 hover:bg-white/[0.045]">
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-primary">
          <span>{article.category}</span>
          <span className="text-slate-600">•</span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            {article.readingTime}
          </span>
        </div>
        <h2 className="mt-3 text-xl font-black leading-tight text-white">
          <Link
            href={`/blog/${article.slug}`}
            className="transition group-hover:text-primary"
          >
            {article.title}
          </Link>
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {article.excerpt}
        </p>
        <Link
          href={`/blog/${article.slug}`}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-white transition hover:text-primary"
        >
          Read guide
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
