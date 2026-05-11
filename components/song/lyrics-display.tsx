"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface LyricsDisplayProps {
  songId: string;
  lyrics: string;
  timestamps?: number[] | null;
  title?: string;
  showMoreLabel?: string;
  showLessLabel?: string;
}

const sectionLabelPattern =
  /^\s*(?:\[(?:verse|chorus|pre[-\s]?chorus|bridge|intro|outro|hook|refrain|final chorus|instrumental|drop|break)(?:\s+\d+)?\]|(?:verse|chorus|pre[-\s]?chorus|bridge|intro|outro|hook|refrain)(?:\s+\d+)?:)\s*$/i;

function cleanLyrics(lyrics: string) {
  return lyrics
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !sectionLabelPattern.test(line))
    .join("\n")
    .trim();
}

export function LyricsDisplay({
  lyrics,
  title = "Lyrics",
  showMoreLabel = "Show more",
  showLessLabel = "Show less",
}: LyricsDisplayProps) {
  const cleanedLyrics = useMemo(() => cleanLyrics(lyrics), [lyrics]);
  const sectionRef = useRef<HTMLElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const hasLongLyrics = cleanedLyrics.split(/\r?\n/).length > 20;

  function handleToggleLyrics() {
    setIsExpanded((current) => {
      const next = !current;

      if (!next) {
        window.requestAnimationFrame(() => {
          sectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }

      return next;
    });
  }

  return (
    <section ref={sectionRef} className="max-w-[540px]">
      <div className="mb-4">
        <h2 className="text-[25px] font-extrabold leading-tight tracking-normal text-white">
          {title}
        </h2>
      </div>

      <div
        className={cn(
          "relative overflow-hidden",
          hasLongLyrics && !isExpanded && "max-h-[442px]",
        )}
      >
        <p className="whitespace-pre-line text-[16px] font-bold leading-[1.38] tracking-normal text-zinc-400">
          {cleanedLyrics}
        </p>
        {hasLongLyrics && !isExpanded ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[#111]" />
        ) : null}
      </div>

      {hasLongLyrics ? (
        <button
          type="button"
          aria-expanded={isExpanded}
          className="mt-1 text-[16px] font-extrabold leading-none text-white hover:underline"
          onClick={handleToggleLyrics}
        >
          {isExpanded ? showLessLabel : showMoreLabel}
        </button>
      ) : null}
    </section>
  );
}
