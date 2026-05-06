"use client";

import { useRef, useState } from "react";
import { Pause, Play, Radio, Share2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SongPlayerProps {
  songId: string;
  title: string;
  audioUrl: string;
  coverUrl: string | null;
  styleLabel: string;
  mood: string;
  playCount: number;
}

async function countSongEvent(songId: string, event: string) {
  await fetch(`/api/song/${songId}/count`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => undefined);
}

export function SongPlayer({
  songId,
  title,
  audioUrl,
  coverUrl,
  styleLabel,
  mood,
  playCount,
}: SongPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const countedPlayRef = useRef(false);
  const countedCompleteRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlayback = async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);

    if (!countedPlayRef.current) {
      countedPlayRef.current = true;
      void countSongEvent(songId, "play_start");
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
      return;
    }

    const nextProgress = audio.currentTime / audio.duration;
    setProgress(nextProgress);
    window.dispatchEvent(
      new CustomEvent(`hit-song:timeupdate:${songId}`, {
        detail: {
          currentTime: audio.currentTime,
          duration: audio.duration,
        },
      }),
    );

    if (!countedCompleteRef.current && nextProgress >= 0.92) {
      countedCompleteRef.current = true;
      void countSongEvent(songId, "play_complete");
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);

    if (!countedCompleteRef.current) {
      countedCompleteRef.current = true;
      void countSongEvent(songId, "play_complete");
    }
  };

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950">
      <div className="grid gap-0 lg:grid-cols-[minmax(260px,0.78fr)_1fr]">
        <div className="relative min-h-[320px] bg-slate-100 dark:bg-slate-900">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`${title} cover art`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Volume2 className="h-16 w-16 text-slate-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
            <Badge className="border-white/20 bg-white/90 text-slate-950 hover:bg-white">
              {styleLabel}
            </Badge>
            <Badge className="border-white/20 bg-slate-950/70 text-white hover:bg-slate-950/70">
              {mood}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col justify-between p-5 sm:p-7 lg:p-8">
          <div>
            <div className="mb-5 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Radio className="h-4 w-4 text-emerald-500" />
              Public AI music page
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-slate-950 dark:text-white sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Listen to this AI-generated {styleLabel.toLowerCase()} song, shaped with a {mood} feel and ready to inspire your own track.
            </p>
          </div>

          <div className="mt-8">
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
                style={{ width: `${Math.min(progress * 100, 100)}%` }}
              />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="icon"
                  onClick={togglePlayback}
                  aria-label={isPlaying ? "Pause song" : "Play song"}
                  className={cn(
                    "h-12 w-12 rounded-full bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200",
                    isPlaying && "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-400",
                  )}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                </Button>
                <div>
                  <p className="text-sm font-medium text-slate-950 dark:text-white">
                    Stream preview
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {playCount.toLocaleString()} plays
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-slate-300 bg-white text-slate-950 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                onClick={() => {
                  void navigator.share?.({
                    title,
                    url: window.location.href,
                  });
                  void countSongEvent(songId, "share");
                }}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
            <audio
              ref={audioRef}
              className="mt-5 w-full"
              controls
              preload="metadata"
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
              onTimeUpdate={handleTimeUpdate}
            >
              <source src={audioUrl} />
            </audio>
          </div>
        </div>
      </div>
    </section>
  );
}
