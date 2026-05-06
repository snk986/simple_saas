import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicSong, getRelatedPublicSongs } from "@/lib/song/public-song";
import { createClient } from "@/utils/supabase/server";
import { defaultLocale, locales, type Locale } from "@/config/i18n";
import { SongHero } from "@/components/song/song-hero";
import { LyricsDisplay } from "@/components/song/lyrics-display";
import { SongSeoSummary } from "@/components/song/song-seo-summary";
import { RelatedSongs } from "@/components/song/related-songs";
import { SongCta } from "@/components/song/song-cta";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

interface SongPageProps {
  params: Promise<{
    locale: Locale;
    id: string;
  }>;
}

function localePrefix(locale: string) {
  return locale === defaultLocale ? "" : `/${locale}`;
}

function songUrl(locale: string, id: string) {
  return `${baseUrl}${localePrefix(locale)}/song/${id}`;
}

function createHref(locale: string, id: string) {
  return `${localePrefix(locale)}/create?ref=song&id=${id}`;
}

function getTimestamps(reportData: Record<string, unknown> | null) {
  const value = reportData?.timestamps;

  if (!Array.isArray(value)) {
    return null;
  }

  const timestamps = value.filter((item): item is number => typeof item === "number");
  return timestamps.length > 0 ? timestamps : null;
}

function buildDescription(song: Awaited<ReturnType<typeof getPublicSong>>) {
  if (!song) {
    return "Listen to an AI-generated song on Hit-Song and create your own music from a story.";
  }

  return `Listen to "${song.title}", an AI-generated ${song.styleLabel} song with a ${song.mood} mood. ${song.storySummary} Create your own song with Hit-Song.`;
}

export async function generateMetadata({ params }: SongPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const song = await getPublicSong(id);

  if (!song || !locales.includes(locale)) {
    return {
      title: "Song not found | Hit-Song",
      robots: { index: false, follow: false },
    };
  }

  const title = `${song.title} - AI Generated ${song.styleLabel} Song | Hit-Song`;
  const description = buildDescription(song);
  const url = songUrl(locale, song.id);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      type: "music.song",
      url,
      siteName: "Hit-Song",
      images: song.coverUrl
        ? [
            {
              url: song.coverUrl,
              alt: `${song.title} cover art`,
            },
          ]
        : undefined,
      audio: [
        {
          url: song.audioUrl,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: song.coverUrl ? [song.coverUrl] : undefined,
    },
  };
}

export default async function SongPage({ params }: SongPageProps) {
  const { locale, id } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const song = await getPublicSong(id);

  if (!song) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === song.userId;
  const relatedSongs = await getRelatedPublicSongs(song);
  const url = songUrl(locale, song.id);
  const prefix = localePrefix(locale);
  const timestamps = getTimestamps(song.reportData);
  const description = buildDescription(song);
  const musicJsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: song.title,
    url,
    description,
    inLanguage: song.locale,
    genre: song.genre,
    datePublished: song.createdAt,
    image: song.coverUrl ?? undefined,
    audio: {
      "@type": "AudioObject",
      contentUrl: song.audioUrl,
      encodingFormat: "audio/mpeg",
    },
    byArtist: {
      "@type": "Organization",
      name: "Hit-Song AI",
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ListenAction",
        userInteractionCount: song.playCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ShareAction",
        userInteractionCount: song.shareCount,
      },
    ],
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Create",
        item: `${baseUrl}${prefix}/create`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: song.styleLabel,
        item: `${baseUrl}${prefix}/song/${song.id}`,
      },
    ],
  };

  return (
    <div className="bg-[#f8fafc] text-slate-950 dark:bg-slate-950 dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(musicJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="container px-4 py-6 md:px-6 md:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <SongHero
            songId={song.id}
            title={song.title}
            audioUrl={song.audioUrl}
            coverUrl={song.coverUrl}
            styleLabel={song.styleLabel}
            mood={song.mood}
            playCount={song.playCount}
            lyricsPreview={song.lyricsPreview}
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <LyricsDisplay
              songId={song.id}
              lyrics={song.lyrics}
              timestamps={timestamps}
            />
            <SongSeoSummary
              storySummary={song.storySummary}
              genre={song.genre}
              mood={song.mood}
              bpm={song.bpm}
              styleTags={song.styleTags}
              totalScore={song.totalScore}
              playCount={song.playCount}
              completeCount={song.completeCount}
              shareCount={song.shareCount}
              createdAt={song.createdAt}
            />
          </div>

          {isOwner && song.reportData ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-7">
              <p className="text-sm font-medium uppercase tracking-normal text-emerald-600 dark:text-emerald-400">
                Creator report
              </p>
              <pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-slate-50 p-4 text-xs leading-6 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {JSON.stringify(song.reportData, null, 2)}
              </pre>
            </section>
          ) : null}

          <RelatedSongs songs={relatedSongs} localePrefix={prefix} />
          <SongCta songId={song.id} createHref={createHref(locale, song.id)} />
        </div>
      </div>
    </div>
  );
}
