"use client";

import { useEffect, useState } from "react";

interface SongHeaderStatsProps {
  locale: string;
  year: string;
  initialPlayCount: number;
  initialShareCount: number;
  initialLikeCount: number;
  labels: {
    plays: string;
    shares: string;
    likes: string;
  };
}

export function SongHeaderStats({
  locale,
  year,
  initialPlayCount,
  initialShareCount,
  initialLikeCount,
  labels,
}: SongHeaderStatsProps) {
  const [playCount, setPlayCount] = useState(initialPlayCount);
  const [shareCount, setShareCount] = useState(initialShareCount);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ type: "play" | "share" | "like" }>;
      if (custom.detail?.type === "play") {
        setPlayCount((current) => current + 1);
      }
      if (custom.detail?.type === "share") {
        setShareCount((current) => current + 1);
      }
      if (custom.detail?.type === "like") {
        setLikeCount((current) => current + 1);
      }
    };

    window.addEventListener("calyra-ai:metric", handler as EventListener);
    return () => {
      window.removeEventListener("calyra-ai:metric", handler as EventListener);
    };
  }, []);

  const stats = [
    year,
    playCount > 0 ? `${playCount.toLocaleString(locale)} ${labels.plays}` : null,
    shareCount > 0 ? `${shareCount.toLocaleString(locale)} ${labels.shares}` : null,
    likeCount > 0 ? `${likeCount.toLocaleString(locale)} ${labels.likes}` : null,
  ].filter(Boolean);

  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-white/80">
      <strong className="text-white">calyra-ai AI</strong>
      {stats.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-2 before:block before:h-1 before:w-1 before:rounded-full before:bg-white/70 before:content-['']"
        >
          {item}
        </span>
      ))}
    </p>
  );
}
