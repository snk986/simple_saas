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
  locale: string;
  labels: {
    sectionLabel: string;
    title: string;
    plays: string;
    complete: string;
    shares: string;
    published: string;
    aiScore: string;
  };
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
  locale,
  labels,
}: SongSeoSummaryProps) {
  const stats = [
    {
      label: labels.plays,
      value: playCount.toLocaleString(locale),
      icon: Headphones,
    },
    {
      label: labels.complete,
      value: completeCount.toLocaleString(locale),
      icon: LineChart,
    },
    {
      label: labels.shares,
      value: shareCount.toLocaleString(locale),
      icon: Share2,
    },
    {
      label: labels.published,
      value: new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(createdAt)),
      icon: CalendarDays,
    },
  ];

  return (
    <section className="mt-12 max-w-5xl border-t border-white/10 pt-8">
      <div className="grid gap-7 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-sm font-medium uppercase tracking-normal text-[#1ed760]">
            {labels.sectionLabel}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">
            {labels.title}
          </h2>
          <p className="mt-4 text-base leading-8 text-zinc-400">
            {storySummary}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="secondary">{genre}</Badge>
            <Badge variant="secondary">{mood}</Badge>
            {bpm ? <Badge variant="secondary">{bpm} BPM</Badge> : null}
            {totalScore ? (
              <Badge variant="secondary">
                {labels.aiScore} {totalScore}
              </Badge>
            ) : null}
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
                className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
              >
                <Icon className="mb-3 h-4 w-4 text-[#1ed760]" />
                <p className="text-lg font-semibold text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-zinc-500">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
