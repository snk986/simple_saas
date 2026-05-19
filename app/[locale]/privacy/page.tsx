import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDocument } from "@/components/legal/legal-document";
import { locales, type Locale } from "@/i18n/routing";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { buildMarketingMetadata } from "@/lib/seo/metadata";

interface PrivacyPageProps {
  params: Promise<{ locale: Locale }>;
}

type LegalSection = {
  title: string;
  body?: string[];
  bullets?: string[];
};

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "legal.privacy",
  });
  const url = absoluteLocaleUrl(locale, "/privacy");

  return buildMarketingMetadata({
    title: t("seo.title"),
    description: t("seo.description"),
    url,
    locale,
    alternates: {
      canonical: url,
      languages: localizedAlternates("/privacy"),
    },
  });
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "legal.privacy",
  });
  const common = await getTranslations({
    locale,
    namespace: "legal.common",
  });

  return (
    <LegalDocument
      backLabel={common("backToHome")}
      backHref="/"
      badge={t("badge")}
      title={t("title")}
      subtitle={t("subtitle")}
      lastUpdatedLabel={common("lastUpdatedLabel")}
      lastUpdated={common("lastUpdated")}
      sections={t.raw("sections") as LegalSection[]}
      relatedTitle={common("relatedTitle")}
      relatedLinks={[
        { label: common("links.terms"), href: "/terms" },
        { label: common("links.refund"), href: "/refund" },
      ]}
      contactTitle={common("contactTitle")}
      contactBody={common("contactBody")}
      contactCtaLabel={common("contactCta")}
      contactCtaHref="/ai-song-maker"
      contactEmailLabel={common("contactEmailLabel")}
    />
  );
}
