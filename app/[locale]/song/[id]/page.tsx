import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPublicSong, getRelatedPublicSongs } from "@/lib/song/public-song";
import { createClient } from "@/utils/supabase/server";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { SongHero } from "@/components/song/song-hero";
import { LyricsDisplay } from "@/components/song/lyrics-display";
import { SongSeoSummary } from "@/components/song/song-seo-summary";
import { RelatedSongs } from "@/components/song/related-songs";
import { SongCta } from "@/components/song/song-cta";
import { absoluteLocaleUrl, baseUrl, localizedAlternates } from "@/lib/i18n/urls";

interface SongPageProps {
  params: Promise<{
    locale: Locale;
    id: string;
  }>;
  searchParams?: Promise<{
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

function getTimestamps(reportData: Record<string, unknown> | null) {
  const value = reportData?.timestamps;

  if (!Array.isArray(value)) {
    return null;
  }

  const timestamps = value.filter((item): item is number => typeof item === "number");
  return timestamps.length > 0 ? timestamps : null;
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

export async function generateMetadata({ params }: SongPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "songPublic.seo" });
  const song = await getPublicSong(id);

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

export default async function SongPage({ params, searchParams }: SongPageProps) {
  const { locale, id } = await params;
  const query = searchParams ? await searchParams : {};
  const t = await getTranslations("songPublic");

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
          {query.utm_campaign === "report_no_share" ? (
            <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {t("recall.reportNoShare")}
            </section>
          ) : null}

          <SongHero
            songId={song.id}
            title={song.title}
            audioUrl={song.audioUrl}
            coverUrl={song.coverUrl}
            styleLabel={song.styleLabel}
            mood={song.mood}
            playCount={song.playCount}
            lyricsPreview={song.lyricsPreview}
            previewLabel={t("previewLyrics")}
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
          </div>

          {isOwner && song.reportData ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-7">
              <p className="text-sm font-medium uppercase tracking-normal text-emerald-600 dark:text-emerald-400">
                {t("creatorReport")}
              </p>
              <pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-slate-50 p-4 text-xs leading-6 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {JSON.stringify(song.reportData, null, 2)}
              </pre>
            </section>
          ) : null}

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
          <SongCta
            songId={song.id}
            createHref={createHref(song.id)}
            labels={{
              title: t("cta.title"),
              description: t("cta.description"),
              create: t("cta.create"),
              copy: t("cta.copy"),
            }}
          />
        </div>
      </div>
    </div>
  );
}
