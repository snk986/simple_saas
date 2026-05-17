import { redirect } from "next/navigation";
import { defaultLocale, type Locale } from "@/i18n/routing";

interface TextToSongPageProps {
  params: Promise<{ locale: Locale }>;
}

export default async function TextToSongPage({ params }: TextToSongPageProps) {
  const { locale } = await params;
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  redirect(`${prefix}/create?mode=text`);
}
