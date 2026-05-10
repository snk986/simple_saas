"use client";

import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Heart,
  MoreHorizontal,
  Pause,
  Play,
  Share2,
  Sparkles,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SongActionBandProps {
  songId: string;
  title: string;
  audioUrl: string;
  createHref: string;
  labels: {
    play: string;
    pause: string;
    like: string;
    liked: string;
    copy: string;
    copied: string;
    copyFailed: string;
    more: string;
    share: string;
    create: string;
  };
}

async function countSongEvent(songId: string, event: string) {
  await fetch(`/api/song/${songId}/count`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => undefined);
}

export function SongActionBand({
  songId,
  title,
  audioUrl,
  createHref,
  labels,
}: SongActionBandProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const countedPlayRef = useRef(false);
  const countedCompleteRef = useRef(false);
  const countedLikeRef = useRef(false);
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && Boolean(navigator.share),
    );
  }, []);

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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: labels.copied });
      void countSongEvent(songId, "share");
    } catch {
      toast({ title: labels.copyFailed });
    }
  };

  const shareSong = async () => {
    if (navigator.share) {
      await navigator
        .share({ title, url: window.location.href })
        .catch(() => undefined);
      void countSongEvent(songId, "share");
      return;
    }

    await copyLink();
  };

  const toggleLike = () => {
    setIsLiked((current) => !current);

    if (!countedLikeRef.current) {
      countedLikeRef.current = true;
      void countSongEvent(songId, "like");
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
    <section className="bg-[linear-gradient(180deg,color-mix(in_srgb,var(--mood-color)_58%,#111_42%)_0%,rgba(17,17,17,0.96)_72%,#111_100%)] px-5 pb-6 pt-5 sm:px-8 sm:pb-7 sm:pt-6">
      <div
        className="flex flex-wrap items-center gap-3 sm:gap-4"
        aria-label="Song actions"
      >
        <Button
          type="button"
          size="icon"
          onClick={togglePlayback}
          aria-label={isPlaying ? labels.pause : labels.play}
          className="h-14 w-14 rounded-full bg-[#1ed760] text-black shadow-[0_10px_30px_rgba(30,215,96,0.24)] hover:bg-[#28e06b]"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="ml-0.5 h-6 w-6" />
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={toggleLike}
          aria-label={isLiked ? labels.liked : labels.like}
          className={cn(
            "h-10 w-10 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white",
            isLiked && "text-[#1ed760] hover:text-[#1ed760]",
          )}
        >
          <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={copyLink}
          aria-label={labels.copy}
          className="h-10 w-10 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <Copy className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={shareSong}
          aria-label={labels.more}
          className="h-10 w-10 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          {canNativeShare ? (
            <MoreHorizontal className="h-6 w-6" />
          ) : (
            <Share2 className="h-5 w-5" />
          )}
        </Button>
        <Button
          asChild
          className="ml-0 h-9 rounded-full bg-white px-4 text-sm font-bold text-black hover:bg-zinc-100 sm:ml-1"
          onClick={() => void countSongEvent(songId, "cta_click")}
        >
          <Link href={createHref}>
            <Sparkles className="mr-2 h-4 w-4" />
            {labels.create}
          </Link>
        </Button>
      </div>
      <div
        className="mt-5 h-1 overflow-hidden rounded-full bg-white/10"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-[#1ed760] transition-[width] duration-300"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
      >
        <source src={audioUrl} />
      </audio>
    </section>
  );
}
