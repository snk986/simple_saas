"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    .map((line) => line.trimEnd())
    .filter((line) => !sectionLabelPattern.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitLyrics(lyrics: string) {
  return cleanLyrics(lyrics)
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);
}

export function LyricsDisplay({
  songId,
  lyrics,
  timestamps,
  title = "Lyrics",
  showMoreLabel = "Show more",
  showLessLabel = "Show less",
}: LyricsDisplayProps) {
  const sections = useMemo(() => splitLyrics(lyrics), [lyrics]);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const hasLongLyrics = sections.join("\n").split(/\r?\n/).length > 22;

  useEffect(() => {
    const handleTimeUpdate = (event: Event) => {
      const detail = (
        event as CustomEvent<{ currentTime: number; duration: number }>
      ).detail;

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
    return () =>
      window.removeEventListener(
        `hit-song:timeupdate:${songId}`,
        handleTimeUpdate,
      );
  }, [sections.length, songId, timestamps]);

  return (
    <section className="max-w-[540px]">
      <div className="mb-4">
        <h2 className="text-[25px] font-extrabold leading-tight tracking-normal text-white">
          {title}
        </h2>
      </div>

      <div
        className={cn(
          "relative overflow-hidden",
          hasLongLyrics && !isExpanded && "max-h-[456px]",
        )}
      >
        {sections.map((section, index) => (
          <div
            key={`${index}-${section.slice(0, 18)}`}
            ref={(node) => {
              sectionRefs.current[index] = node;
            }}
            className={cn(
              "transition-colors duration-300",
              activeSection === index ? "text-zinc-200" : "text-zinc-400",
            )}
          >
            <p className="whitespace-pre-line text-[16px] font-bold leading-[1.38] tracking-normal">
              {section}
            </p>
          </div>
        ))}
        {hasLongLyrics && !isExpanded ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[#111]" />
        ) : null}
      </div>

      {hasLongLyrics ? (
        <button
          type="button"
          className="mt-1 text-[16px] font-extrabold leading-none text-white hover:underline"
          onClick={() => setIsExpanded((current) => !current)}
        >
          ...{isExpanded ? showLessLabel : showMoreLabel}
        </button>
      ) : null}
    </section>
  );
}
