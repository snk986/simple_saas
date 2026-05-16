import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDocument } from "@/components/legal/legal-document";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { buildMarketingMetadata } from "@/lib/seo/metadata";

interface RefundPageProps {
  params: Promise<{ locale: Locale }>;
}

type LegalSection = {
  title: string;
  body?: string[];
  bullets?: string[];
};

export async function generateMetadata({
  params,
}: RefundPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: defaultLocale,
    namespace: "legal.refund",
  });
  const url = absoluteLocaleUrl(locale, "/refund");

  return buildMarketingMetadata({
    title: t("seo.title"),
    description: t("seo.description"),
    url,
    locale,
    alternates: {
      canonical: url,
      languages: localizedAlternates("/refund"),
    },
  });
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RefundPage({ params }: RefundPageProps) {
  await params;
  const t = await getTranslations({
    locale: defaultLocale,
    namespace: "legal.refund",
  });
  const common = await getTranslations({
    locale: defaultLocale,
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
        { label: common("links.terms"), href: "/terms" },
      ]}
      contactTitle={common("contactTitle")}
      contactBody={common("contactBody")}
      contactCtaLabel={common("contactCta")}
      contactCtaHref="/pricing"
      contactEmailLabel={common("contactEmailLabel")}
    />
  );
}
