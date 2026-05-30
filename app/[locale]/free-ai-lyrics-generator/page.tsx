import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { songTemplates } from "@/config/song-templates";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { buildMarketingMetadata } from "@/lib/seo/metadata";
import { SongTemplateLibrary } from "@/components/song-templates/song-template-library";

interface FreeAiLyricsGeneratorPageProps {
  params: Promise<{ locale: Locale }>;
}

const pagePath = "/free-ai-lyrics-generator";
const pageTitle = "Free Lyrics to Song AI Generator | Turn Lyrics Into Music";
const pageDescription =
  "Choose ready-made lyrics and matched music styles, then turn lyrics into a complete AI song with Calyra AI.";

function localePrefix(locale: Locale) {
  return locale === defaultLocale ? "" : `/${locale}`;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: FreeAiLyricsGeneratorPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    return {
      title: pageTitle,
      robots: { index: false, follow: false },
    };
  }

  return buildMarketingMetadata({
    title: pageTitle,
    description: pageDescription,
    url: absoluteLocaleUrl(locale, pagePath),
    locale,
    alternates: {
      canonical: absoluteLocaleUrl(locale, pagePath),
      languages: localizedAlternates(pagePath),
    },
  });
}

export default async function FreeAiLyricsGeneratorPage({
  params,
}: FreeAiLyricsGeneratorPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const lyricsToSongPath = `${localePrefix(locale)}/ai-lyrics-to-song`;

  return (
    <div className="min-h-screen bg-[#07080b] text-white">
      <section className="border-b border-white/10 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),#07080b] bg-[size:56px_56px]">
        <div className="container px-4 py-10 md:px-6 md:py-12">
          <h1 className="max-w-4xl text-4xl font-black leading-none tracking-normal md:text-6xl">
            Free Lyrics to Song AI Generator
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 md:text-lg">
            {pageDescription}
          </p>
        </div>
      </section>

      <section className="container px-4 py-8 md:px-6 md:py-10">
        <SongTemplateLibrary
          templates={songTemplates}
          lyricsToSongPath={lyricsToSongPath}
        />
      </section>
    </div>
  );
}
