"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface LyricsDisplayProps {
  songId: string;
  lyrics: string;
  timestamps?: number[] | null;
  title?: string;
}

function splitLyrics(lyrics: string) {
  return lyrics
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean);
}

export function LyricsDisplay({
  songId,
  lyrics,
  timestamps,
  title = "Lyrics",
}: LyricsDisplayProps) {
  const sections = useMemo(() => splitLyrics(lyrics), [lyrics]);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeSection, setActiveSection] = useState(0);

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
    <section className="max-w-3xl">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold tracking-normal text-white">
          {title}
        </h2>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <div
            key={`${index}-${section.slice(0, 18)}`}
            ref={(node) => {
              sectionRefs.current[index] = node;
            }}
            className={cn(
              "border-l-2 py-1 pl-4 transition-all duration-300",
              activeSection === index
                ? "border-[#1ed760] text-white"
                : "border-transparent text-zinc-400",
            )}
          >
            <p className="whitespace-pre-line text-[17px] font-semibold leading-8">
              {section}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
