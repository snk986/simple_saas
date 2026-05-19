import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AboutContent } from "@/components/about/about-content";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { buildMarketingMetadata } from "@/lib/seo/metadata";

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
      title: "About Calyra AI",
      robots: { index: false, follow: false },
    };
  }

  const t = await getTranslations({ locale, namespace: "about" });
  const url = absoluteLocaleUrl(locale, "/about");

  return buildMarketingMetadata({
    title: t("seo.title"),
    description: t("seo.description"),
    url,
    locale,
    alternates: {
      canonical: url,
      languages: localizedAlternates("/about"),
    },
  });
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale)) {
    notFound();
  }
  const t = await getTranslations({ locale, namespace: "about" });

  return (
    <AboutContent
      createHref={localePath(locale, "/ai-song-maker")}
      pricingHref={localePath(locale, "/pricing")}
      content={{
        eyebrow: t("eyebrow"),
        title: t("title"),
        subtitle: t("subtitle"),
        createCta: t("createCta"),
        pricingCta: t("pricingCta"),
        pillars: t.raw("pillars"),
        whyEyebrow: t("whyEyebrow"),
        whyTitle: t("whyTitle"),
        whyBody: t.raw("whyBody"),
        trustEyebrow: t("trustEyebrow"),
        trustTitle: t("trustTitle"),
        trustBody: t("trustBody"),
        trustCta: t("trustCta"),
      }}
    />
  );
}
