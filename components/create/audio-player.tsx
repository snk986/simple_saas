"use client";

import Link from "next/link";
import { ExternalLink, Music, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface AudioPlayerProps {
  songId: string;
  title: string;
  coverUrl?: string | null;
  audioUrl?: string | null;
  altSongId?: string | null;
  altAudioUrl?: string | null;
  altCoverUrl?: string | null;
  canDownload: boolean;
}

export function AudioPlayer({
  songId,
  title,
  coverUrl,
  audioUrl,
  altSongId,
  altAudioUrl,
  altCoverUrl,
  canDownload,
}: AudioPlayerProps) {
  const t = useTranslations("create.audioPlayer");
  const tracks = [
    {
      key: "primary",
      label: "Version A",
      url: audioUrl,
      coverUrl,
      publicHref: `/song/${songId}`,
    },
    {
      key: "alt",
      label: "Version B",
      url: altAudioUrl,
      coverUrl: altCoverUrl ?? coverUrl,
      publicHref: altSongId ? `/song/${altSongId}` : null,
    },
  ].filter((track) => track.url);

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm shadow-black/20">
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
              {t("readyForPreview")}
            </Badge>
          </div>
          <h2 className="break-words text-2xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("savedAsSeparate")}
          </p>

          <div className="mt-5 grid gap-3">
            {tracks.map((track) => (
              <article
                key={track.key}
                className="rounded-lg border border-border bg-muted/30 p-4 transition-colors"
              >
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-medium">{track.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      Saved as a separate song
                    </p>
                  </div>
                  {track.publicHref ? (
                    <Button asChild type="button" size="sm" variant="outline">
                      <Link href={track.publicHref}>
                        {t("openPage")}
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : null}
                </div>
                <audio controls preload="metadata" className="w-full">
                  <source src={track.url!} />
                </audio>
                <div className="mt-3">
                  {canDownload ? (
                    <Button asChild type="button" size="sm" variant="outline">
                      <a href={track.url!} download>
                        {t("download")}
                      </a>
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" disabled>
                      {t("upgradeToDownload")}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button asChild className="gap-2">
              <Link href={`/song/${songId}`}>
                {t("openPublicPage")}
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">{t("viewDashboard")}</Link>
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{t("rightsNotice")}</p>
        </div>
      </div>
    </section>
  );
}
