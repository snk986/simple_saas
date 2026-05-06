"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LyricsDisplayProps {
  songId: string;
  lyrics: string;
  timestamps?: number[] | null;
}

function splitLyrics(lyrics: string) {
  return lyrics
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);
}

export function LyricsDisplay({ songId, lyrics, timestamps }: LyricsDisplayProps) {
  const sections = useMemo(() => splitLyrics(lyrics), [lyrics]);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const handleTimeUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ currentTime: number; duration: number }>).detail;

      if (!detail || sections.length === 0) {
        return;
      }

      let nextSection = 0;

      if (timestamps && timestamps.length >= sections.length) {
        nextSection = timestamps.reduce((currentIndex, startTime, index) => {
          return detail.currentTime >= startTime ? index : currentIndex;
        }, 0);
      } else if (Number.isFinite(detail.duration) && detail.duration > 0) {
        const sectionDuration = detail.duration / sections.length;
        nextSection = Math.min(
          sections.length - 1,
          Math.floor(detail.currentTime / sectionDuration),
        );
      }

      setActiveSection((current) => {
        if (current === nextSection) {
          return current;
        }

        sectionRefs.current[nextSection]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return nextSection;
      });
    };

    window.addEventListener(`hit-song:timeupdate:${songId}`, handleTimeUpdate);
    return () => window.removeEventListener(`hit-song:timeupdate:${songId}`, handleTimeUpdate);
  }, [sections.length, songId, timestamps]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-7">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-600 dark:text-emerald-400">
            Lyrics
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
            Singable story
          </h2>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
          <Music2 className="h-5 w-5" />
        </div>
      </div>

      <div className="max-h-[560px] space-y-4 overflow-y-auto pr-1">
        {sections.map((section, index) => (
          <div
            key={`${index}-${section.slice(0, 18)}`}
            ref={(node) => {
              sectionRefs.current[index] = node;
            }}
            className={cn(
              "rounded-lg border p-4 transition-all duration-300",
              activeSection === index
                ? "border-emerald-300 bg-emerald-50 text-slate-950 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-white"
                : "border-transparent bg-slate-50 text-slate-600 dark:bg-slate-900/70 dark:text-slate-300",
            )}
          >
            <p className="whitespace-pre-line text-base leading-8">{section}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
