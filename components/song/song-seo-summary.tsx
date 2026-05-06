import { CalendarDays, Headphones, LineChart, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SongSeoSummaryProps {
  storySummary: string;
  genre: string;
  mood: string;
  bpm: number | null;
  styleTags: string[];
  totalScore: number | null;
  playCount: number;
  completeCount: number;
  shareCount: number;
  createdAt: string;
}

export function SongSeoSummary({
  storySummary,
  genre,
  mood,
  bpm,
  styleTags,
  totalScore,
  playCount,
  completeCount,
  shareCount,
  createdAt,
}: SongSeoSummaryProps) {
  const stats = [
    { label: "Plays", value: playCount.toLocaleString(), icon: Headphones },
    { label: "Full listens", value: completeCount.toLocaleString(), icon: LineChart },
    { label: "Shares", value: shareCount.toLocaleString(), icon: Share2 },
    {
      label: "Published",
      value: new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(createdAt)),
      icon: CalendarDays,
    },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-7">
      <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-emerald-600 dark:text-emerald-400">
            Song story
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
            Built from a real prompt
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
            {storySummary}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="secondary">{genre}</Badge>
            <Badge variant="secondary">{mood}</Badge>
            {bpm ? <Badge variant="secondary">{bpm} BPM</Badge> : null}
            {totalScore ? <Badge variant="secondary">AI score {totalScore}</Badge> : null}
            {styleTags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <Icon className="mb-3 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-lg font-semibold text-slate-950 dark:text-white">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
