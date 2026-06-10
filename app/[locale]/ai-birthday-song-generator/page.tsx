import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BirthdaySongStartForm } from "@/components/seo/birthday-song-start-form";
import { SeoToolPage } from "@/components/seo/seo-tool-page";
import { SEO_TOOL_PAGE_PATHS } from "@/config/seo-pages";
import { locales, type Locale } from "@/i18n/routing";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { buildMarketingMetadata } from "@/lib/seo/metadata";

interface AiBirthdaySongGeneratorPageProps {
  params: Promise<{ locale: Locale }>;
}

const pageKey = "aiBirthdaySongGenerator";
const pagePath = SEO_TOOL_PAGE_PATHS[pageKey];

export async function generateMetadata({
  params,
}: AiBirthdaySongGeneratorPageProps): Promise<Metadata> {
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

export default async function AiBirthdaySongGeneratorPage({
  params,
}: AiBirthdaySongGeneratorPageProps) {
  const { locale } = await params;
  const t = await getTranslations(`seoPages.${pageKey}`);
  const benefitKeys = ["name", "story", "gift"] as const;
  const stepKeys = ["personalize", "style", "generate"] as const;
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
        secondaryCta={t("cta.secondary")}
        secondaryHref={SEO_TOOL_PAGE_PATHS.aiSongMaker}
        form={
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.72fr)] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-primary">
                {t("hero.eyebrow")}
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-normal text-foreground md:text-5xl">
                {t("hero.title")}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                {t("hero.description")}
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span className="rounded-md border bg-background px-3 py-1.5">
                  {t("hero.proof.withName")}
                </span>
                <span className="rounded-md border bg-background px-3 py-1.5">
                  {t("hero.proof.personalized")}
                </span>
                <span className="rounded-md border bg-background px-3 py-1.5">
                  {t("hero.proof.free")}
                </span>
              </div>
            </div>
            <BirthdaySongStartForm
              labels={{
                name: t("form.name"),
                namePlaceholder: t("form.namePlaceholder"),
                recipient: t("form.recipient"),
                message: t("form.message"),
                messagePlaceholder: t("form.messagePlaceholder"),
                vibe: t("form.vibe"),
                style: t("form.style"),
                styleDefault: t("form.styleDefault"),
                submit: t("form.submit"),
                badge: t("form.badge"),
                options: {
                  mom: t("form.options.mom"),
                  dad: t("form.options.dad"),
                  partner: t("form.options.partner"),
                  friend: t("form.options.friend"),
                  child: t("form.options.child"),
                  coworker: t("form.options.coworker"),
                  warm: t("form.options.warm"),
                  funny: t("form.options.funny"),
                  emotional: t("form.options.emotional"),
                  upbeat: t("form.options.upbeat"),
                  surprise: t("form.options.surprise"),
                },
              }}
            />
          </div>
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
      />
    </>
  );
}
