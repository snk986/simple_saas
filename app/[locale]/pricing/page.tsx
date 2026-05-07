import type { Metadata } from "next";
import { CheckCircle2, Music2, Sparkles, Trophy } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { locales, type Locale } from "@/i18n/routing";

interface PricingPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: PricingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricingPage.seo" });
  const url = absoluteLocaleUrl(locale, "/pricing");

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: url,
      languages: localizedAlternates("/pricing"),
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      url,
      siteName: "Hit-Song",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = await params;
  const t = await getTranslations("pricingPage");
  const planKeys = ["starter", "creator", "studio"] as const;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: t("seo.title"),
    url: absoluteLocaleUrl(locale, "/pricing"),
    itemListElement: planKeys.map((key) => ({
      "@type": "Offer",
      name: t(`plans.${key}.name`),
      description: t(`plans.${key}.description`),
      price: t(`plans.${key}.priceValue`),
      priceCurrency: "USD",
    })),
  };

  return (
    <div className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-normal md:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {planKeys.map((key, index) => {
              const Icon = index === 0 ? Music2 : index === 1 ? Sparkles : Trophy;
              const featureKeys = ["feature1", "feature2", "feature3"] as const;

              return (
                <article
                  key={key}
                  className="flex h-full flex-col rounded-lg border bg-card p-6 shadow-sm"
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <h2 className="mt-5 text-2xl font-semibold">
                    {t(`plans.${key}.name`)}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t(`plans.${key}.description`)}
                  </p>
                  <p className="mt-6 text-4xl font-bold">
                    {t(`plans.${key}.price`)}
                  </p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {featureKeys.map((featureKey) => (
                      <li key={featureKey} className="flex gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        {t(`plans.${key}.${featureKey}`)}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-7" variant={index === 1 ? "default" : "outline"}>
                    <Link href="/create">{t("planCta")}</Link>
                  </Button>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
