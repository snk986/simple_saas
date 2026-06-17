import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDocument } from "@/components/legal/legal-document";
import { locales, type Locale } from "@/i18n/routing";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { buildMarketingMetadata } from "@/lib/seo/metadata";

interface TermsPageProps {
  params: Promise<{ locale: Locale }>;
}

type LegalSection = {
  title: string;
  body?: string[];
  bullets?: string[];
};

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "legal.terms",
  });
  const url = absoluteLocaleUrl(locale, "/terms");

  return buildMarketingMetadata({
    title: t("seo.title"),
    description: t("seo.description"),
    url,
    locale,
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      canonical: url,
      languages: localizedAlternates("/terms"),
    },
  });
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "legal.terms",
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
        { label: common("links.privacy"), href: "/privacy" },
        { label: common("links.refund"), href: "/refund" },
      ]}
      contactTitle={common("contactTitle")}
      contactBody={common("contactBody")}
      contactCtaLabel={common("contactCta")}
      contactCtaHref="/pricing"
      contactEmailLabel={common("contactEmailLabel")}
    />
  );
}
