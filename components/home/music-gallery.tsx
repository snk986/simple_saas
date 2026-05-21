"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CirclePlay,
  Pause,
  Play,
  Star,
  Volume2,
  X,
} from "lucide-react";

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

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
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
  const [activeSong, setActiveSong] = useState<FeaturedGallerySong | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const togglePlayback = (song: FeaturedGallerySong) => {
    const currentAudio = audioRef.current;

    if (playingSongId === song.id && currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      setPlayingSongId(null);
      setActiveSong(song);
      return;
    }

    currentAudio?.pause();

    const nextAudio = new Audio(song.audioUrl);
    nextAudio.volume = volume;
    audioRef.current = nextAudio;
    setActiveSong(song);
    setPlayingSongId(song.id);
    setCurrentTime(0);
    setDuration(0);

    nextAudio.addEventListener("loadedmetadata", () => {
      setDuration(nextAudio.duration);
    });
    nextAudio.addEventListener("timeupdate", () => {
      setCurrentTime(nextAudio.currentTime);
      setDuration(nextAudio.duration);
    });
    nextAudio.addEventListener(
      "ended",
      () => {
        if (audioRef.current === nextAudio) {
          setPlayingSongId(null);
          setCurrentTime(nextAudio.duration);
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

  const toggleActivePlayback = () => {
    if (!activeSong) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      togglePlayback(activeSong);
      return;
    }

    if (audio.paused) {
      setPlayingSongId(activeSong.id);
      void audio.play().catch(() => setPlayingSongId(null));
    } else {
      audio.pause();
      setPlayingSongId(null);
    }
  };

  const seekTo = (nextTime: number) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const changeVolume = (nextVolume: number) => {
    const normalized = Math.min(Math.max(nextVolume, 0), 1);
    setVolume(normalized);
    if (audioRef.current) {
      audioRef.current.volume = normalized;
    }
  };

  const closePlayer = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingSongId(null);
    setActiveSong(null);
    setCurrentTime(0);
    setDuration(0);
  };

  if (songs.length === 0) {
    return null;
  }

  return (
    <>
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

      {activeSong ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-900/95 px-4 py-3 text-white shadow-[0_-18px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-3 md:grid-cols-[240px_minmax(180px,1fr)_220px]">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={activeSong.coverUrl}
                alt={activeSong.title}
                className="h-12 w-12 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-black md:text-base">
                  {activeSong.title}
                </p>
                <p className="truncate text-xs font-semibold text-slate-400">
                  {activeSong.badge
                    ? `${activeSong.artist}, ${activeSong.badge}`
                    : activeSong.artist}
                </p>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-[42px_minmax(0,1fr)_42px] items-center gap-3">
              <span className="text-right text-xs tabular-nums text-slate-400">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={Math.min(currentTime, duration || currentTime)}
                onChange={(event) => seekTo(Number(event.currentTarget.value))}
                className="h-1 w-full accent-sky-500"
                aria-label="Song progress"
              />
              <span className="text-xs tabular-nums text-slate-400">
                {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={toggleActivePlayback}
                aria-label={playingSongId ? "Pause song" : "Play song"}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                {playingSongId ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 fill-current" />
                )}
              </button>
              <Volume2 className="hidden h-5 w-5 text-slate-400 sm:block" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(event) =>
                  changeVolume(Number(event.currentTarget.value))
                }
                className="hidden h-1 w-20 accent-sky-500 sm:block"
                aria-label="Volume"
              />
              <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
              <button
                type="button"
                onClick={closePlayer}
                aria-label="Close player"
                className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
