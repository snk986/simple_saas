import type { Metadata } from "next";
import {
  buildSongMakerMetadata,
  SongMakerRoutePage,
} from "@/components/song-maker/song-maker-route-page";
import { locales, type Locale } from "@/i18n/routing";

interface AiLyricsToSongPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<Record<string, string | undefined>>;
}

const routeKey = "aiLyricsToSong";

export async function generateMetadata({
  params,
}: AiLyricsToSongPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildSongMakerMetadata({ locale, routeKey });
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function AiLyricsToSongPage({
  params,
}: AiLyricsToSongPageProps) {
  const { locale } = await params;

  return (
    <SongMakerRoutePage
      locale={locale}
      routeKey={routeKey}
      initialMode="lyrics"
      searchParams={{}}
      cleanUrl
    />
  );
}
