import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { locales, type Locale } from "@/i18n/routing";
import { defaultLocale } from "@/config/i18n";
import { CREDIT_PACKS, SUBSCRIPTION_TIERS } from "@/config/subscriptions";
import { PricingBuyButton } from "@/components/pricing/pricing-buy-button";
import { createClient } from "@/utils/supabase/server";
import type { PlanTier } from "@/types/subscriptions";

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

function localizedCreateHref(locale: Locale) {
  return `${locale === defaultLocale ? "" : `/${locale}`}/create`;
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = await params;
  const t = await getTranslations("pricingPage");
  const tp = await getTranslations("pricing");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const creditPackKeys = ["mini", "standard", "pro_pack"] as const;
  const subscriptionMonthly = SUBSCRIPTION_TIERS.filter(
    (tier) => tier.billingPeriod === "monthly",
  );
  const subscriptionYearly = SUBSCRIPTION_TIERS.filter(
    (tier) => tier.billingPeriod === "yearly",
  );
  const basicMonthly = subscriptionMonthly.find((tier) => tier.plan === "basic");
  const basicYearly = subscriptionYearly.find((tier) => tier.plan === "basic");
  const proMonthly = subscriptionMonthly.find((tier) => tier.plan === "pro");
  const proYearly = subscriptionYearly.find((tier) => tier.plan === "pro");

  let accountSummary: {
    plan: PlanTier;
    hasActiveSubscription: boolean;
  } | null = null;

  if (user) {
    const { data: customer } = await supabase
      .from("customers")
      .select(
        `
        subscriptions (
          status,
          creem_product_id,
          current_period_end,
          metadata
        )
      `,
      )
      .eq("user_id", user.id)
      .maybeSingle();

    const activeSubscription = customer?.subscriptions?.find((subscription) =>
      ["active", "trialing"].includes(subscription.status),
    );
    const metadataPlan =
      typeof activeSubscription?.metadata?.plan === "string"
        ? activeSubscription.metadata.plan
        : undefined;
    const matchedTier = SUBSCRIPTION_TIERS.find(
      (tier) =>
        tier.productId &&
        tier.productId === activeSubscription?.creem_product_id,
    );
    const plan =
      metadataPlan === "basic" || metadataPlan === "pro"
        ? metadataPlan
        : (matchedTier?.plan ?? "free");

    accountSummary = {
      plan,
      hasActiveSubscription: Boolean(activeSubscription),
    };
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: t("seo.title"),
    url: absoluteLocaleUrl(locale, "/pricing"),
    itemListElement: [
      ...CREDIT_PACKS.map((pack) => ({
        "@type": "Offer",
        name: pack.name,
        price: pack.priceValue,
        priceCurrency: "USD",
      })),
      ...subscriptionMonthly.map((sub) => ({
        "@type": "Offer",
        name: sub.name,
        price: sub.priceValue,
        priceCurrency: "USD",
        billingIncrement: 1,
        billingDuration: "P1M",
      })),
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4, 5].map((i) => ({
      "@type": "Question",
      name: t(`faq.q${i}`),
      acceptedAnswer: { "@type": "Answer", text: t(`faq.a${i}`) },
    })),
  };

  return (
    <div className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="py-14 md:py-16">
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
        </div>
      </section>

      <section className="bg-muted/30 py-12">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              {t("subscriptionsHighlight")}
            </p>
            <h2 className="mt-2 text-4xl font-bold tracking-normal md:text-5xl">
              {t("subscriptionsTitle")}
            </h2>
            <p className="mt-3 text-base text-muted-foreground md:text-lg">
              {t("subscriptionsSubtitle")}
            </p>
            <p className="mt-3 text-sm font-medium text-foreground">
              {t("subscriptionsUrgency")}
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-6xl rounded-2xl border bg-card p-4 shadow-sm shadow-black/15 md:p-5">
            <div className="grid gap-3 lg:grid-cols-3">
              {basicMonthly && basicYearly && (
                <article className="flex h-full flex-col rounded-xl border bg-background p-4">
                  <h4 className="text-lg font-semibold">{t("subscriptions.basic.name")}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("subscriptions.basic.description")}
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-xs font-medium text-muted-foreground">{t("monthly")}</p>
                      <p className="mt-1 text-2xl font-bold">
                        ${basicMonthly.priceValue}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">{tp("perMonth")}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{basicMonthly.creditAmount} {tp("credits")}{tp("perMonth")}</p>
                      <div className="mt-2">
                        <PricingBuyButton
                          tierId={basicMonthly.id}
                          locale={locale}
                          managePlan={accountSummary?.hasActiveSubscription && accountSummary.plan === "basic"}
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-xs font-medium text-muted-foreground">{t("yearly")}</p>
                      <p className="mt-1 text-2xl font-bold">
                        ${basicYearly.priceValue}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">{tp("perYear")}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{basicYearly.creditAmount} {tp("credits")}{tp("perYear")}</p>
                      <div className="mt-2">
                        <PricingBuyButton
                          tierId={basicYearly.id}
                          locale={locale}
                          managePlan={accountSummary?.hasActiveSubscription && accountSummary.plan === "basic"}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {proMonthly && proYearly && (
                <article className="relative flex h-full flex-col rounded-xl border-2 border-primary bg-background p-4 shadow-sm shadow-primary/20">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                    {tp("mostPopular")}
                  </span>
                  <h4 className="text-lg font-semibold">{t("subscriptions.pro.name")}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("subscriptions.pro.description")}
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-xs font-medium text-muted-foreground">{t("monthly")}</p>
                      <p className="mt-1 text-2xl font-bold">
                        ${proMonthly.priceValue}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">{tp("perMonth")}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{proMonthly.creditAmount} {tp("credits")}{tp("perMonth")}</p>
                      <div className="mt-2">
                        <PricingBuyButton
                          tierId={proMonthly.id}
                          locale={locale}
                          featured
                          managePlan={accountSummary?.hasActiveSubscription && accountSummary.plan === "pro"}
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-xs font-medium text-muted-foreground">{t("yearly")}</p>
                      <p className="mt-1 text-2xl font-bold">
                        ${proYearly.priceValue}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">{tp("perYear")}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{proYearly.creditAmount} {tp("credits")}{tp("perYear")}</p>
                      <div className="mt-2">
                        <PricingBuyButton
                          tierId={proYearly.id}
                          locale={locale}
                          featured
                          managePlan={accountSummary?.hasActiveSubscription && accountSummary.plan === "pro"}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              )}

              <article className="flex h-full flex-col rounded-xl border bg-background p-4">
                <h4 className="text-lg font-semibold">{tp("freePlan")}</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("freeCard.description")}
                </p>
                <div className="mt-3 rounded-lg border bg-card p-3">
                  <p className="text-xs font-medium text-muted-foreground">{t("freeCard.priceLabel")}</p>
                  <p className="mt-1 text-2xl font-bold">$0</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("freeCard.creditHint")}</p>
                </div>
                <ul className="mt-3 flex-1 space-y-2">
                  {(["feature1", "feature2", "feature3"] as const).map((fk) => (
                    <li key={fk} className="flex gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {t(`freeCard.${fk}`)}
                    </li>
                  ))}
                </ul>
                <a
                  href={localizedCreateHref(locale)}
                  className="mt-3 inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-accent"
                >
                  {tp("getStarted")}
                </a>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">{t("creditPacksTitle")}</h2>
            <p className="mt-2 text-muted-foreground">
              {t("creditPacksSubtitle")}
            </p>
          </div>
          <div className="mt-8 grid max-w-5xl gap-4 mx-auto lg:grid-cols-3">
            {CREDIT_PACKS.map((pack, index) => {
              const key = creditPackKeys[index];
              return (
                <article
                  key={pack.id}
                    className={`relative flex h-full flex-col rounded-lg border bg-card p-5 shadow-sm shadow-black/15 ${
                    pack.featured ? "border-primary ring-1 ring-primary" : ""
                  }`}
                >
                  {pack.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                      {tp("mostPopular")}
                    </span>
                  )}
                  <h3 className="text-xl font-semibold">
                    {t(`creditPacks.${key}.name`)}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`creditPacks.${key}.description`)}
                  </p>
                  <p className="mt-4 text-4xl font-bold">
                    {pack.price}
                    <span className="ml-1 text-base font-normal text-muted-foreground">
                      {tp("oneTime")}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pack.creditAmount} {tp("credits")}
                  </p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {(["feature1", "feature2", "feature3"] as const).map(
                      (fk) => (
                        <li
                          key={fk}
                          className="flex gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {t(`creditPacks.${key}.${fk}`)}
                        </li>
                      ),
                    )}
                  </ul>
                  <div className="mt-6">
                    <PricingBuyButton
                      tierId={pack.id}
                      locale={locale}
                      featured={pack.featured}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-center">{t("faq.title")}</h2>
            <dl className="mt-8 space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <dt className="font-medium">{t(`faq.q${i}`)}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">
                    {t(`faq.a${i}`)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}
