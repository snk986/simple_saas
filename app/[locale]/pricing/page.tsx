import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { locales, type Locale } from "@/i18n/routing";
import { defaultLocale } from "@/config/i18n";
import { CREDIT_PACKS, SUBSCRIPTION_TIERS } from "@/config/subscriptions";
import { PricingBuyButton } from "@/components/pricing/pricing-buy-button";
import { SubscriptionPlanGrid } from "@/components/pricing/subscription-plan-grid";
import { createClient } from "@/utils/supabase/server";
import type { PlanTier } from "@/types/subscriptions";
import { buildMarketingMetadata } from "@/lib/seo/metadata";

interface PricingPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: PricingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricingPage.seo" });
  const url = absoluteLocaleUrl(locale, "/pricing");

  return buildMarketingMetadata({
    title: t("title"),
    description: t("description"),
    url,
    locale,
    alternates: {
      canonical: url,
      languages: localizedAlternates("/pricing"),
    },
  });
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

  const creditPackKeys = ["standard", "pro_pack"] as const;
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
  const createHref = localizedCreateHref(locale);

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
    mainEntity: [1, 2, 3, 4, 5, 6].map((i) => ({
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
            <h1 className="mt-3 text-4xl font-bold tracking-normal md:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-12">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-normal md:text-4xl">
              {t("subscriptionsTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {t("subscriptionsSubtitle")}
            </p>
          </div>

          {basicMonthly && basicYearly && proMonthly && proYearly && (
            <SubscriptionPlanGrid
              locale={locale}
              createHref={createHref}
              manageBasic={
                Boolean(accountSummary?.hasActiveSubscription) &&
                accountSummary?.plan === "basic"
              }
              managePro={
                Boolean(accountSummary?.hasActiveSubscription) &&
                accountSummary?.plan === "pro"
              }
              basicMonthly={{
                tierId: basicMonthly.id,
                priceValue: basicMonthly.priceValue,
                songs: Math.floor(basicMonthly.creditAmount / 100),
              }}
              basicYearly={{
                tierId: basicYearly.id,
                priceValue: basicYearly.priceValue,
                songs: Math.floor(basicYearly.creditAmount / 100),
              }}
              proMonthly={{
                tierId: proMonthly.id,
                priceValue: proMonthly.priceValue,
                songs: Math.floor(proMonthly.creditAmount / 100),
              }}
              proYearly={{
                tierId: proYearly.id,
                priceValue: proYearly.priceValue,
                songs: Math.floor(proYearly.creditAmount / 100),
              }}
              labels={{
                monthly: t("monthly"),
                yearly: t("yearly"),
                save69: t("save69"),
                subscribeNowCancelAnytime: t("subscribeNowCancelAnytime"),
                songsUnit: t("songsUnit"),
                perMonth: tp("perMonth"),
                perYear: tp("perYear"),
                getStarted: tp("getStarted"),
                freePlan: tp("freePlan"),
                basic: {
                  name: t("subscriptions.basic.name"),
                  description: t("subscriptions.basic.description"),
                  features: [
                    t("subscriptions.basic.feature1"),
                    t("subscriptions.basic.feature2"),
                    t("subscriptions.basic.feature3"),
                  ],
                },
                pro: {
                  name: t("subscriptions.pro.name"),
                  description: t("subscriptions.pro.description"),
                  features: [
                    t("subscriptions.pro.feature1"),
                    t("subscriptions.pro.feature2"),
                    t("subscriptions.pro.feature3"),
                  ],
                },
                free: {
                  description: t("freeCard.description"),
                  creditHint: t("freeCard.creditHint"),
                  features: [
                    t("freeCard.feature1"),
                    t("freeCard.feature2"),
                    t("freeCard.feature3"),
                  ],
                },
              }}
            />
          )}
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
          <div className="mx-auto mt-8 grid max-w-4xl gap-4 lg:grid-cols-2">
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
                      {t("popularPack")}
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
                    {Math.floor(pack.creditAmount / 100)} {t("songsUnit")}
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
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
