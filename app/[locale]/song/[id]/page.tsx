import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPublicSong, getRelatedPublicSongs } from "@/lib/song/public-song";
import { createClient } from "@/utils/supabase/server";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { LyricsDisplay } from "@/components/song/lyrics-display";
import { SongActionBand } from "@/components/song/song-action-band";
import { SongSeoSummary } from "@/components/song/song-seo-summary";
import { RelatedSongs } from "@/components/song/related-songs";
import {
  absoluteLocaleUrl,
  baseUrl,
  localizedAlternates,
} from "@/lib/i18n/urls";
import { Music } from "lucide-react";

interface SongPageProps {
  params: Promise<{
    locale: Locale;
    id: string;
  }>;
  searchParams?: Promise<{
    take?: string;
    utm_campaign?: string;
    utm_medium?: string;
    utm_source?: string;
    song_id?: string;
  }>;
}

function localePrefix(locale: string) {
  return locale === defaultLocale ? "" : `/${locale}`;
}

function songUrl(locale: Locale, id: string) {
  return absoluteLocaleUrl(locale, `/song/${id}`);
}

function createHref(id: string) {
  return `/create?ref=song&id=${id}`;
}

function moodColor(mood: string) {
  const normalized = mood.toLowerCase();

  if (normalized.includes("happy") || normalized.includes("joy")) {
    return "#d39b35";
  }

  if (normalized.includes("sad") || normalized.includes("melanch")) {
    return "#6f819a";
  }

  if (normalized.includes("romantic") || normalized.includes("love")) {
    return "#a86b75";
  }

  if (normalized.includes("energetic") || normalized.includes("dance")) {
    return "#8b7a3f";
  }

  if (normalized.includes("dark") || normalized.includes("angry")) {
    return "#5f6670";
  }

  if (normalized.includes("calm") || normalized.includes("peace")) {
    return "#728f87";
  }

  return "#8b9ab0";
}

function getTimestamps(reportData: Record<string, unknown> | null) {
  const value = reportData?.timestamps;

  if (!Array.isArray(value)) {
    return null;
  }

  const timestamps = value.filter(
    (item): item is number => typeof item === "number",
  );
  return timestamps.length > 0 ? timestamps : null;
}

function normalizeTake(take?: string) {
  return take === "alt" ? "alt" : take === "primary" ? "primary" : undefined;
}

function buildDescription(
  song: Awaited<ReturnType<typeof getPublicSong>>,
  template: (values: Record<string, string>) => string,
) {
  if (!song) {
    return "";
  }

  return template({
    title: song.title,
    style: song.styleLabel,
    mood: song.mood,
    story: song.storySummary,
  });
}

export async function generateMetadata({
  params,
  searchParams,
}: SongPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const query = searchParams ? await searchParams : {};
  const t = await getTranslations({ locale, namespace: "songPublic.seo" });
  const song = await getPublicSong(id, normalizeTake(query.take));

  if (!song || !locales.includes(locale)) {
    return {
      title: t("notFoundTitle"),
      robots: { index: false, follow: false },
    };
  }

  const title = t("title", { title: song.title, style: song.styleLabel });
  const description = buildDescription(song, (values) =>
    t("description", values),
  );
  const url = songUrl(locale, song.id);

  const ogImageUrl =
    song.reportData && song.totalScore !== null
      ? `${baseUrl}/api/share/og?songId=${song.id}`
      : song.coverUrl;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: localizedAlternates(`/song/${song.id}`),
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
      locale,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              alt: t("ogImageAlt", { title: song.title }),
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
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

export default async function SongPage({
  params,
  searchParams,
}: SongPageProps) {
  const { locale, id } = await params;
  const query = searchParams ? await searchParams : {};
  const t = await getTranslations("songPublic");

  if (!locales.includes(locale)) {
    notFound();
  }

  const song = await getPublicSong(id, normalizeTake(query.take));

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
  const artistName = "Hit-Song AI";
  const publishedYear = new Intl.DateTimeFormat(locale, {
    year: "numeric",
  }).format(new Date(song.createdAt));
  const headerStats = [
    publishedYear,
    song.playCount > 0
      ? t("header.plays", { count: song.playCount.toLocaleString(locale) })
      : null,
    song.likeCount > 0
      ? t("header.likes", { count: song.likeCount.toLocaleString(locale) })
      : null,
  ].filter(Boolean);
  const description = buildDescription(song, (values) =>
    t("seo.description", values),
  );
  const musicJsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: song.title,
    url,
    description,
    inLanguage: locale,
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
        name: t("breadcrumbCreate"),
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
    <div className="bg-[#0b0b0b] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(musicJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-0 py-0 sm:px-4 sm:py-6 md:px-6 md:py-10">
        <div
          className="overflow-hidden border border-zinc-900 bg-[#111] shadow-[0_18px_60px_rgba(0,0,0,0.32)] sm:rounded-lg"
          style={{ "--mood-color": moodColor(song.mood) } as CSSProperties}
        >
          {query.utm_campaign === "report_no_share" ? (
            <section className="border-b border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-sm text-emerald-100 sm:px-8">
              {t("recall.reportNoShare")}
            </section>
          ) : null}

          <section className="bg-[var(--mood-color)] px-5 py-6 sm:px-8 sm:py-8">
            <div className="grid items-end gap-5 sm:grid-cols-[184px_minmax(0,1fr)] sm:gap-6">
              <div className="aspect-square w-36 overflow-hidden rounded-md bg-zinc-800 shadow-[0_22px_60px_rgba(0,0,0,0.38)] sm:w-[184px]">
                {song.coverUrl ? (
                  <img
                    src={song.coverUrl}
                    alt={t("header.coverAlt", { title: song.title })}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Music className="h-12 w-12 text-zinc-400" />
                  </div>
                )}
              </div>
              <div>
                <p className="mb-2 text-sm font-extrabold text-white sm:mb-3">
                  {t("header.type")}
                </p>
                <h1 className="max-w-4xl text-5xl font-black leading-[0.96] tracking-normal text-white sm:text-7xl lg:text-8xl">
                  {song.title}
                </h1>
                <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-white/80">
                  <strong className="text-white">{artistName}</strong>
                  {headerStats.map((item) => (
                    <span
                      key={item}
                      className="before:mr-2 before:content-['•']"
                    >
                      {item}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </section>

          <SongActionBand
            songId={song.id}
            title={song.title}
            audioUrl={song.audioUrl}
            createHref={createHref(song.id)}
            labels={{
              play: t("actions.play"),
              pause: t("actions.pause"),
              like: t("actions.like"),
              liked: t("actions.liked"),
              copy: t("actions.copy"),
              copied: t("actions.copied"),
              copyFailed: t("actions.copyFailed"),
              more: t("actions.more"),
              share: t("actions.share"),
              create: t("actions.create"),
            }}
          />

          <section className="bg-[#111] px-5 pb-16 pt-2 sm:px-8 sm:pb-20">
            <LyricsDisplay
              songId={song.id}
              lyrics={song.lyrics}
              timestamps={timestamps}
              title={t("lyrics.title")}
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
              locale={locale}
              labels={{
                sectionLabel: t("summary.sectionLabel"),
                title: t("summary.title"),
                plays: t("summary.plays"),
                complete: t("summary.complete"),
                shares: t("summary.shares"),
                published: t("summary.published"),
                aiScore: t("summary.aiScore"),
              }}
            />

            {isOwner && song.reportData ? (
              <section className="mt-12 rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:p-7">
                <p className="text-sm font-medium uppercase tracking-normal text-[#1ed760]">
                  {t("creatorReport")}
                </p>
                <pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-black/30 p-4 text-xs leading-6 text-zinc-300">
                  {JSON.stringify(song.reportData, null, 2)}
                </pre>
              </section>
            ) : null}

            <div className="mt-12">
              <RelatedSongs
                songs={relatedSongs}
                labels={{
                  sectionLabel: t("related.sectionLabel"),
                  title: t("related.title"),
                  playCount: t("related.playCount"),
                  coverAlt: t("related.coverAlt"),
                  styleMoodSeparator: t("related.styleMoodSeparator"),
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
