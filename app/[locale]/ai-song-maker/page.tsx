import type { Metadata } from "next";
import {
  buildSongMakerMetadata,
  SongMakerRoutePage,
} from "@/components/song-maker/song-maker-route-page";
import { locales, type Locale } from "@/i18n/routing";

interface AiSongMakerPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    id?: string;
    ref?: string;
    utm_campaign?: string;
    upgraded?: string;
    prompt?: string;
    style?: string;
    title?: string;
    jobId?: string;
  }>;
}

const routeKey = "aiSongMaker";

export async function generateMetadata({
  params,
}: AiSongMakerPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildSongMakerMetadata({ locale, routeKey });
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function AiSongMakerPage({
  params,
  searchParams,
}: AiSongMakerPageProps) {
  const { locale } = await params;
  const query = await searchParams;

  return (
    <SongMakerRoutePage
      locale={locale}
      routeKey={routeKey}
      initialMode="text"
      searchParams={query}
    />
  );
}
