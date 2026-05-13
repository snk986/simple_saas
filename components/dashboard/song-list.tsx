"use client";

import Link from "next/link";
import { Copy, ExternalLink, Music2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface DashboardSong {
  listId: string;
  title: string;
  displayTitle: string;
  versionLabel: string;
  status: string;
  isPublic: boolean;
  coverUrl: string | null;
  playCount: number;
  completeCount: number;
  shareCount: number;
  ctaClickCount: number;
  publicHref: string;
  reportHref: string;
  createdAt: string;
  expiresAt: string | null;
  audioUrl: string | null;
}

interface SongListProps {
  songs: DashboardSong[];
  locale: string;
  createHref: string;
  canDownload: boolean;
  labels: {
    title: string;
    subtitle: string;
    createSong: string;
    emptyTitle: string;
    emptySubtitle: string;
    coverAlt: string;
    statusPublic: string;
    statusPrivate: string;
    createdOn: string;
    expiresOn: string;
    metrics: {
      plays: string;
      full: string;
      shares: string;
      cta: string;
    };
    copyLink: string;
    download: string;
    upgradeToDownload: string;
    preview: string;
    report: string;
    versionA: string;
    versionB: string;
  };
}

function formatLabel(template: string, value: string) {
  return template.replace("{date}", value);
}

export function SongList({
  songs,
  locale,
  createHref,
  canDownload,
  labels,
}: SongListProps) {
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm shadow-black/20 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{labels.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.subtitle}
          </p>
        </div>
        <Button asChild>
          <Link href={createHref}>{labels.createSong}</Link>
        </Button>
      </div>

      {songs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
          <Music2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">{labels.emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.emptySubtitle}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {songs.map((song) => (
            <article
              key={song.listId}
              className="grid gap-4 py-4 first:pt-0 last:pb-0 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]"
            >
              <div className="flex min-w-0 gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  {song.coverUrl ? (
                    <img
                      src={song.coverUrl}
                      alt={labels.coverAlt.replace("{title}", song.displayTitle)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Music2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant={song.isPublic ? "default" : "secondary"}>
                      {song.isPublic ? labels.statusPublic : labels.statusPrivate}
                    </Badge>
                    <Badge variant="outline">{song.status}</Badge>
                  </div>
                  <h3 className="truncate text-base font-semibold">
                    {song.displayTitle}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-primary">
                    {song.versionLabel}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatLabel(
                      labels.createdOn,
                      dateFormatter.format(new Date(song.createdAt)),
                    )}
                  </p>
                  {song.expiresAt && song.status !== "expired" ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatLabel(
                        labels.expiresOn,
                        dateFormatter.format(new Date(song.expiresAt)),
                      )}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="min-w-0 flex flex-col gap-3">
                <div className="min-w-0 grid grid-cols-4 gap-2 text-center">
                  {[
                    [labels.metrics.plays, song.playCount],
                    [labels.metrics.full, song.completeCount],
                    [labels.metrics.shares, song.shareCount],
                    [labels.metrics.cta, song.ctaClickCount],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-muted/40 p-2">
                      <p className="text-sm font-semibold">
                        {Number(value).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex min-w-0 flex-wrap gap-2">
                  {song.audioUrl && canDownload ? (
                    <Button asChild size="sm" variant="outline" className="min-w-[120px] gap-2">
                      <a href={song.audioUrl} download>
                        {labels.download}
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="min-w-[120px] gap-2" disabled>
                      {labels.upgradeToDownload}
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-w-[120px] gap-2"
                    disabled={!song.isPublic || song.status !== "ready"}
                    onClick={() => {
                      const url = new URL(
                        song.publicHref,
                        window.location.origin,
                      );
                      void navigator.clipboard?.writeText(url.toString());
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    {labels.copyLink}
                  </Button>
                  {song.isPublic && song.status === "ready" ? (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="min-w-[120px] gap-2"
                    >
                      <Link href={song.publicHref}>
                        {labels.preview}
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-w-[120px] gap-2"
                      disabled
                    >
                      {labels.preview}
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button asChild size="sm" variant="outline" className="min-w-[120px] gap-2">
                    <Link href={song.reportHref}>
                      {labels.report}
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
