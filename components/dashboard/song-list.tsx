"use client";

import Link from "next/link";
import { Copy, ExternalLink, Music2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface DashboardSong {
  id: string;
  title: string;
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
}

interface SongListProps {
  songs: DashboardSong[];
}

export function SongList({ songs }: SongListProps) {
  return (
    <section className="rounded-lg border bg-background p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Your songs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Public links, listening metrics, and share performance.
          </p>
        </div>
        <Button asChild>
          <Link href="/create">Create song</Link>
        </Button>
      </div>

      {songs.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center">
          <Music2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No songs yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first song to publish a searchable music page.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {songs.map((song) => (
            <article
              key={song.id}
              className="grid gap-4 py-4 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_360px]"
            >
              <div className="flex min-w-0 gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  {song.coverUrl ? (
                    <img
                      src={song.coverUrl}
                      alt={`${song.title} cover art`}
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
                      {song.isPublic ? "Public" : "Private"}
                    </Badge>
                    <Badge variant="outline">{song.status}</Badge>
                  </div>
                  <h3 className="truncate text-base font-semibold">
                    {song.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Created{" "}
                    {new Intl.DateTimeFormat("en", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(song.createdAt))}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    ["Plays", song.playCount],
                    ["Full", song.completeCount],
                    ["Shares", song.shareCount],
                    ["CTA", song.ctaClickCount],
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
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-2"
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
                    Copy link
                  </Button>
                  {song.isPublic && song.status === "ready" ? (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <Link href={song.publicHref}>
                        Preview
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      disabled
                    >
                      Preview
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button asChild size="sm" variant="outline" className="gap-2">
                    <Link href={song.reportHref}>
                      Report
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
