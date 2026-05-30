"use client";

import { useMemo, useState } from "react";
import type { SongTemplate } from "@/config/song-templates";
import { TemplateGenerateButton } from "@/components/song-templates/template-generate-button";

interface SongTemplateLibraryProps {
  templates: SongTemplate[];
  lyricsToSongPath: string;
}

const MAIN_FILTERS = [
  { id: "pop", label: "Pop", keywords: ["pop", "alt-pop", "dance-pop"] },
  { id: "rock", label: "Rock", keywords: ["rock", "pop-rock"] },
  { id: "hip-hop", label: "Hip-Hop", keywords: ["hip-hop", "west-coast"] },
  { id: "r-and-b", label: "R&B", keywords: ["r-and-b"] },
  { id: "country", label: "Country", keywords: ["country", "country-pop"] },
  { id: "ballad", label: "Ballad", keywords: ["ballad"] },
] as const;

function searchableText(template: SongTemplate) {
  return [
    template.title,
    template.lyrics,
    template.style,
    template.categories.join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

export function SongTemplateLibrary({
  templates,
  lyricsToSongPath,
}: SongTemplateLibraryProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const visibleTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return templates.filter((template) => {
      const templateCategories = template.categories.join(" ");
      const activeFilter = MAIN_FILTERS.find(
        (filter) => filter.id === activeCategory,
      );
      const matchesCategory =
        activeCategory === "all" ||
        Boolean(
          activeFilter?.keywords.some((keyword) =>
            templateCategories.includes(keyword),
          ),
        );
      const matchesQuery =
        !normalizedQuery || searchableText(template).includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query, templates]);

  return (
    <div>
      <div className="mb-6 grid gap-3 rounded-[20px] border border-white/10 bg-white/[0.045] p-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <label>
          <span className="sr-only">Search templates</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, lyric, style, or category"
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-slate-500"
          />
        </label>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`h-12 rounded-2xl border px-4 text-sm font-black transition ${
              activeCategory === "all"
                ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
                : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]"
            }`}
          >
            All
          </button>
          {MAIN_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveCategory(filter.id)}
              className={`h-12 rounded-2xl border px-4 text-sm font-black transition ${
                activeCategory === filter.id
                  ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
                  : "border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {visibleTemplates.length ? (
        <div className="grid gap-5">
          {visibleTemplates.map((template, index) => {
            const isExpanded = Boolean(expanded[template.id]);

            return (
              <article
                key={template.id}
                className="overflow-hidden rounded-[24px] border border-white/10 bg-[#111318] shadow-[0_24px_80px_rgba(0,0,0,0.34)]"
              >
                <div className="grid gap-4 border-b border-white/10 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-black leading-tight tracking-normal text-white md:text-3xl">
                      {template.title}
                    </h2>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-black text-slate-500">
                      TPL-{String(index + 1).padStart(3, "0")}
                    </span>
                  </div>
                  <TemplateGenerateButton
                    lyricsToSongPath={lyricsToSongPath}
                    title={template.title}
                    lyrics={template.lyrics}
                    style={template.style}
                    className="h-12 rounded-2xl bg-emerald-400 px-5 text-sm font-black text-black hover:bg-emerald-300"
                  />
                </div>

                <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
                  <section className="p-5">
                    <h3 className="mb-4 text-sm font-black uppercase tracking-normal text-white">
                      Lyrics
                    </h3>
                    <div className="relative">
                      <p
                        className={`whitespace-pre-wrap text-sm leading-7 text-slate-300 ${
                          isExpanded ? "" : "max-h-36 overflow-hidden"
                        }`}
                      >
                        {template.lyrics}
                      </p>
                      {!isExpanded ? (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-[#111318]/0 to-[#111318]" />
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((current) => ({
                          ...current,
                          [template.id]: !isExpanded,
                        }))
                      }
                      className="mt-3 text-sm font-black text-emerald-200 transition hover:text-emerald-400"
                    >
                      {isExpanded ? "Show less" : "...Show more"}
                    </button>
                  </section>

                  <section className="border-t border-white/10 bg-white/[0.025] p-5 lg:border-l lg:border-t-0">
                    <h3 className="mb-4 text-sm font-black uppercase tracking-normal text-white">
                      Matched style
                    </h3>
                    <p className="text-sm leading-7 text-slate-300">
                      {template.style}
                    </p>
                  </section>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">
          No templates match this search.
        </div>
      )}
    </div>
  );
}
