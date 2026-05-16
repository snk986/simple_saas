import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDocument } from "@/components/legal/legal-document";
import { defaultLocale } from "@/i18n/routing";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { buildMarketingMetadata } from "@/lib/seo/metadata";

type LegalSection = {
  title: string;
  body?: string[];
  bullets?: string[];
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({
    locale: defaultLocale,
    namespace: "legal.privacy",
  });
  const url = absoluteLocaleUrl(defaultLocale, "/privacy");

  return buildMarketingMetadata({
    title: t("seo.title"),
    description: t("seo.description"),
    url,
    locale: defaultLocale,
    alternates: {
      canonical: url,
      languages: localizedAlternates("/privacy"),
    },
  });
}

export default async function PrivacyPage() {
  const t = await getTranslations({
    locale: defaultLocale,
    namespace: "legal.privacy",
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
        { label: common("links.terms"), href: "/terms" },
        { label: common("links.refund"), href: "/refund" },
      ]}
      contactTitle={common("contactTitle")}
      contactBody={common("contactBody")}
      contactCtaLabel={common("contactCta")}
      contactCtaHref="/create"
      contactEmailLabel={common("contactEmailLabel")}
    />
  );
}
