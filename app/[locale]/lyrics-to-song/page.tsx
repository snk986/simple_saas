import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SeoSongStartForm } from "@/components/seo/seo-song-start-form";
import { SeoToolPage } from "@/components/seo/seo-tool-page";
import { SEO_TOOL_PAGE_PATHS } from "@/config/seo-pages";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { buildMarketingMetadata } from "@/lib/seo/metadata";
import { locales, type Locale } from "@/i18n/routing";

interface LyricsToSongPageProps {
  params: Promise<{ locale: Locale }>;
}

const pageKey = "lyricsToSong";
const pagePath = SEO_TOOL_PAGE_PATHS[pageKey];

export async function generateMetadata({
  params,
}: LyricsToSongPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: `seoPages.${pageKey}.seo`,
  });
  const url = absoluteLocaleUrl(locale, pagePath);

  return buildMarketingMetadata({
    title: t("title"),
    description: t("description"),
    url,
    locale,
    alternates: {
      canonical: url,
      languages: localizedAlternates(pagePath),
    },
  });
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LyricsToSongPage({
  params,
}: LyricsToSongPageProps) {
  const { locale } = await params;
  const t = await getTranslations(`seoPages.${pageKey}`);
  const createHref = "/create?mode=lyrics";
  const textToSongHref = SEO_TOOL_PAGE_PATHS.textToSong;
  const benefitKeys = ["lyrics", "arrangement", "control"] as const;
  const stepKeys = ["paste", "direct", "create"] as const;
  const faqKeys = ["one", "two", "three", "four"] as const;
  const faqs = faqKeys.map((key) => ({
    question: t(`faq.${key}.question`),
    answer: t(`faq.${key}.answer`),
  }));

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t("hero.title"),
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    url: absoluteLocaleUrl(locale, pagePath),
    description: t("seo.description"),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SeoToolPage
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        description={t("hero.description")}
        primaryCta={t("cta.primary")}
        primaryHref={createHref}
        secondaryCta={t("cta.secondary")}
        secondaryHref={textToSongHref}
        form={
          <SeoSongStartForm
            mode="lyrics"
            labels={{
              prompt: t("form.prompt"),
              placeholder: t("form.placeholder"),
              style: t("form.style"),
              stylePlaceholder: t("form.stylePlaceholder"),
              styleDefault: t("form.styleDefault"),
              title: t("form.title"),
              titlePlaceholder: t("form.titlePlaceholder"),
              titleDefault: t("form.titleDefault"),
              submit: t("form.submit"),
            }}
          />
        }
        benefitsTitle={t("benefits.title")}
        benefitsDescription={t("benefits.description")}
        benefits={benefitKeys.map((key) => ({
          title: t(`benefits.items.${key}.title`),
          description: t(`benefits.items.${key}.description`),
        }))}
        stepsTitle={t("steps.title")}
        stepsDescription={t("steps.description")}
        steps={stepKeys.map((key) => ({
          title: t(`steps.items.${key}.title`),
          description: t(`steps.items.${key}.description`),
        }))}
        faqTitle={t("faq.title")}
        faqs={faqs}
        finalCtaTitle={t("finalCta.title")}
        finalCtaDescription={t("finalCta.description")}
      />
    </>
  );
}
