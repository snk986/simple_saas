"use client";

import { useRef, useState } from "react";
import { CirclePlay, Pause, Play, Star } from "lucide-react";

export type FeaturedGallerySong = {
  id: string;
  title: string;
  artist: string;
  badge: string | null;
  audioUrl: string;
  coverUrl: string;
  playCount: number;
  likeCount: number;
};

function formatCount(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

async function countPlay(songId: string) {
  await fetch(`/api/song/${songId}/count`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "play_start" }),
    keepalive: true,
  }).catch(() => undefined);
}

export function MusicGallery({ songs }: { songs: FeaturedGallerySong[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const countedRef = useRef<Set<string>>(new Set());
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);

  const togglePlayback = (song: FeaturedGallerySong) => {
    const currentAudio = audioRef.current;

    if (playingSongId === song.id && currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      setPlayingSongId(null);
      return;
    }

    currentAudio?.pause();

    const nextAudio = new Audio(song.audioUrl);
    audioRef.current = nextAudio;
    setPlayingSongId(song.id);

    nextAudio.addEventListener(
      "ended",
      () => {
        if (audioRef.current === nextAudio) {
          setPlayingSongId(null);
        }
      },
      { once: true },
    );
    nextAudio.addEventListener(
      "error",
      () => {
        if (audioRef.current === nextAudio) {
          setPlayingSongId(null);
        }
      },
      { once: true },
    );

    if (!countedRef.current.has(song.id)) {
      countedRef.current.add(song.id);
      void countPlay(song.id);
    }

    void nextAudio.play().catch(() => {
      if (audioRef.current === nextAudio) {
        setPlayingSongId(null);
      }
    });
  };

  if (songs.length === 0) {
    return null;
  }

  return (
    <div className="mt-10 overflow-x-auto overflow-y-hidden pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto flex w-max touch-pan-x flex-nowrap gap-4 snap-x snap-mandatory">
        {songs.map((song) => {
          const isPlaying = playingSongId === song.id;
          return (
            <article
              key={song.id}
              className="w-[clamp(150px,46vw,220px)] shrink-0 snap-start sm:w-44 md:w-56"
            >
              <div className="relative aspect-[7/10] overflow-hidden rounded-xl bg-white/[0.06] shadow-2xl shadow-black/25">
                <img
                  src={song.coverUrl}
                  alt={song.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.04),transparent_48%,rgba(0,0,0,0.42))]" />
                <button
                  type="button"
                  aria-label={`${isPlaying ? "Pause" : "Play"} ${song.title}`}
                  onClick={() => togglePlayback(song)}
                  className="absolute left-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/75"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <CirclePlay className="h-5 w-5" />
                  )}
                </button>
                <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/30 px-2 py-1.5 text-xs font-black text-white backdrop-blur">
                    <Play className="h-3 w-3 fill-current" />
                    {formatCount(song.playCount)}
                  </span>
                  {song.badge ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/30 px-2 py-1.5 text-xs font-black text-white backdrop-blur">
                      <Star className="h-3 w-3 fill-current" />
                      {song.badge}
                    </span>
                  ) : null}
                </div>
              </div>
              <h3 className="mt-4 truncate text-lg font-black tracking-normal text-white">
                {song.title}
              </h3>
              <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-400">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 text-xs font-black text-white">
                  {song.artist.charAt(0)}
                </span>
                <span className="truncate">{song.artist}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
