import { redirect } from "next/navigation";
import { defaultLocale, type Locale } from "@/i18n/routing";

interface LyricsToSongPageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function LyricsToSongPage({
  params,
}: LyricsToSongPageProps) {
  const { locale } = await params;
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  redirect(`${prefix}/create?mode=lyrics`);
}
