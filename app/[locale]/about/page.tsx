import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutContent } from "@/components/about/about-content";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";

interface AboutPageProps {
  params: Promise<{ locale: Locale }>;
}

function localePath(locale: Locale, path: string) {
  return locale === defaultLocale ? path : `/${locale}${path}`;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    return {
      title: "About Hit-Song",
      robots: { index: false, follow: false },
    };
  }

  const url = absoluteLocaleUrl(locale, "/about");

  return {
    title: "About Hit-Song - AI Music Creation From Personal Stories",
    description:
      "Learn how Hit-Song turns personal stories into AI-generated lyrics, audio, producer-style reports, and shareable song pages.",
    alternates: {
      canonical: url,
      languages: localizedAlternates("/about"),
    },
    openGraph: {
      title: "About Hit-Song",
      description:
        "Hit-Song is an AI music creation platform for turning stories into lyrics, audio, reports, and public song pages.",
      type: "website",
      url,
      siteName: "Hit-Song",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: "About Hit-Song",
      description:
        "Turn personal stories into AI-generated lyrics, audio, reports, and shareable song pages.",
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }

  return (
    <AboutContent
      createHref={localePath(locale, "/create")}
      pricingHref={localePath(locale, "/pricing")}
    />
  );
}
