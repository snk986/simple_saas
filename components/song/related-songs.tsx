import Link from "next/link";
import { Music } from "lucide-react";
import type { RelatedSong } from "@/lib/song/public-song";

interface RelatedSongsProps {
  songs: RelatedSong[];
  localePrefix: string;
}

export function RelatedSongs({ songs, localePrefix }: RelatedSongsProps) {
  if (songs.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-600 dark:text-emerald-400">
            Related songs
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
            Keep listening
          </h2>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {songs.map((song) => (
          <Link
            key={song.id}
            href={`${localePrefix}/song/${song.id}`}
            className="group overflow-hidden rounded-lg border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-900">
              {song.coverUrl ? (
                <img
                  src={song.coverUrl}
                  alt={`${song.title} cover art`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Music className="h-8 w-8 text-slate-400" />
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="line-clamp-1 text-base font-semibold text-slate-950 dark:text-white">
                {song.title}
              </p>
              <p className="mt-2 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">
                {song.styleLabel} · {song.mood}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                {song.playCount.toLocaleString()} plays
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
