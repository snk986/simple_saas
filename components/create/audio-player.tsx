"use client";

import Link from "next/link";
import { Check, ExternalLink, Music, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SelectedAudio } from "@/types/song";

interface AudioPlayerProps {
  songId: string;
  title: string;
  coverUrl?: string | null;
  audioUrl?: string | null;
  audioUrlAlt?: string | null;
  selectedAudio: SelectedAudio;
  isSelecting: boolean;
  onSelect: (selectedAudio: SelectedAudio) => void;
}

export function AudioPlayer({
  songId,
  title,
  coverUrl,
  audioUrl,
  audioUrlAlt,
  selectedAudio,
  isSelecting,
  onSelect,
}: AudioPlayerProps) {
  const tracks = [
    { key: "primary" as const, label: "Version A", url: audioUrl },
    { key: "alt" as const, label: "Version B", url: audioUrlAlt },
  ].filter((track) => track.url);

  return (
    <section className="rounded-lg border bg-background p-5 shadow-sm">
      <div className="grid gap-5 md:grid-cols-[180px_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`${title} cover art`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Music className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Radio className="h-3 w-3" />
              Ready for preview
            </Badge>
          </div>
          <h2 className="break-words text-2xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The selected version will be used for sharing, previews, and the
            public song page.
          </p>

          <div className="mt-5 grid gap-3">
            {tracks.map((track) => {
              const isSelected = selectedAudio === track.key;

              return (
                <article
                  key={track.key}
                  className={cn(
                    "rounded-lg border p-4 transition-colors",
                    isSelected
                      ? "border-primary/40 bg-primary/5"
                      : "bg-muted/20",
                  )}
                >
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base font-medium">{track.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {isSelected ? "Selected for sharing" : "Available take"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      disabled={isSelecting || isSelected}
                      onClick={() => onSelect(track.key)}
                      className="gap-2"
                    >
                      {isSelected ? <Check className="h-4 w-4" /> : null}
                      {isSelected ? "Selected" : "Use this"}
                    </Button>
                  </div>
                  <audio controls preload="metadata" className="w-full">
                    <source src={track.url!} />
                  </audio>
                </article>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button asChild className="gap-2">
              <Link href={`/song/${songId}`}>
                Open public page
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">View dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
