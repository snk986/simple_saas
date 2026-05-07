import { SongPlayer } from "@/components/song/song-player";

interface SongHeroProps {
  songId: string;
  title: string;
  audioUrl: string;
  coverUrl: string | null;
  styleLabel: string;
  mood: string;
  playCount: number;
  lyricsPreview: string;
  previewLabel: string;
}

export function SongHero({
  songId,
  title,
  audioUrl,
  coverUrl,
  styleLabel,
  mood,
  playCount,
  lyricsPreview,
  previewLabel,
}: SongHeroProps) {
  return (
    <div className="space-y-5">
      <SongPlayer
        songId={songId}
        title={title}
        audioUrl={audioUrl}
        coverUrl={coverUrl}
        styleLabel={styleLabel}
        mood={mood}
        playCount={playCount}
      />
      <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <p className="text-sm font-medium uppercase tracking-normal text-emerald-600 dark:text-emerald-400">
          {previewLabel}
        </p>
        <p className="mt-3 whitespace-pre-line text-base leading-8 text-slate-600 dark:text-slate-300">
          {lyricsPreview}
        </p>
      </section>
    </div>
  );
}
