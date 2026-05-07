import type { Metadata } from "next";
import { CheckCircle2, Shield, Clock, CreditCard, RefreshCcw } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { absoluteLocaleUrl, localizedAlternates } from "@/lib/i18n/urls";
import { locales, type Locale } from "@/i18n/routing";
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
    (tier) => tier.billingPeriod === "monthly"
  );
  const subscriptionYearly = SUBSCRIPTION_TIERS.filter(
    (tier) => tier.billingPeriod === "yearly"
  );
  let accountSummary: {
    credits: number;
    plan: PlanTier;
    hasActiveSubscription: boolean;
  } | null = null;

  if (user) {
    const { data: customer } = await supabase
      .from("customers")
      .select(
        `
        credits,
        credits_balance,
        subscriptions (
          status,
          creem_product_id,
          current_period_end,
          metadata
        )
      `
      )
      .eq("user_id", user.id)
      .maybeSingle();

    const activeSubscription = customer?.subscriptions?.find((subscription) =>
      ["active", "trialing"].includes(subscription.status)
    );
    const metadataPlan =
      typeof activeSubscription?.metadata?.plan === "string"
        ? activeSubscription.metadata.plan
        : undefined;
    const matchedTier = SUBSCRIPTION_TIERS.find(
      (tier) => tier.productId && tier.productId === activeSubscription?.creem_product_id
    );
    const plan =
      metadataPlan === "basic" || metadataPlan === "pro"
        ? metadataPlan
        : matchedTier?.plan ?? "free";

    accountSummary = {
      credits: customer?.credits_balance ?? customer?.credits ?? 0,
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

      {/* Hero */}
      <section className="border-b py-16 md:py-20">
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
          {accountSummary && (
            <div className="mx-auto mt-8 grid max-w-2xl gap-3 rounded-lg border bg-card p-4 text-left shadow-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                  {tp("currentPlan")}
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {tp(`${accountSummary.plan}Plan`)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                  {tp("credits")}
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {accountSummary.credits} {tp("credits")}
                </p>
              </div>
            </div>
          )}
          {/* Trust badges */}
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> {t("trust.refund")}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {t("trust.noExpiry")}
            </span>
            <span className="flex items-center gap-1.5">
              <RefreshCcw className="h-4 w-4" /> {t("trust.cancel")}
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" /> {t("trust.currency")}
            </span>
          </div>
        </div>
      </section>

      {/* Credit Packs */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">{t("creditPacksTitle")}</h2>
            <p className="mt-2 text-muted-foreground">
              {t("creditPacksSubtitle")}
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3 max-w-5xl mx-auto">
            {CREDIT_PACKS.map((pack, index) => {
              const key = creditPackKeys[index];
              return (
                <article
                  key={pack.id}
                  className={`relative flex h-full flex-col rounded-lg border bg-card p-6 shadow-sm ${
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
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          {t(`creditPacks.${key}.${fk}`)}
                        </li>
                      )
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
      {/* Subscriptions */}
      <section className="border-t py-16">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">{t("subscriptionsTitle")}</h2>
            <p className="mt-2 text-muted-foreground">
              {t("subscriptionsSubtitle")}
            </p>
          </div>

          {/* Monthly */}
          <div className="mt-10 max-w-5xl mx-auto">
            <h3 className="mb-4 text-lg font-semibold">{t("monthly")}</h3>
            <div className="grid gap-5 lg:grid-cols-2">
              {subscriptionMonthly.map((tier) => {
                const planKey = tier.plan as "basic" | "pro";
                return (
                  <article
                    key={tier.id}
                    className={`relative flex h-full flex-col rounded-lg border bg-card p-6 shadow-sm ${
                      tier.featured
                        ? "border-primary ring-1 ring-primary"
                        : ""
                    }`}
                  >
                    {tier.featured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                        {tp("mostPopular")}
                      </span>
                    )}
                    <h4 className="text-xl font-semibold">
                      {t(`subscriptions.${planKey}.name`)}
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(`subscriptions.${planKey}.description`)}
                    </p>
                    <p className="mt-4 text-4xl font-bold">
                      ${tier.priceValue}
                      <span className="ml-1 text-base font-normal text-muted-foreground">
                        {tp("perMonth")}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tier.creditAmount} {tp("credits")}{tp("perMonth")}
                    </p>
                    <ul className="mt-5 flex-1 space-y-2.5">
                      {(["feature1", "feature2", "feature3"] as const).map(
                        (fk) => (
                          <li
                            key={fk}
                            className="flex gap-2 text-sm text-muted-foreground"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            {t(`subscriptions.${planKey}.${fk}`)}
                          </li>
                        )
                      )}
                    </ul>
                    <div className="mt-6">
                      <PricingBuyButton
                        tierId={tier.id}
                        locale={locale}
                        featured={tier.featured}
                        managePlan={
                          accountSummary?.hasActiveSubscription &&
                          accountSummary.plan === tier.plan
                        }
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Yearly */}
          <div className="mt-10 max-w-5xl mx-auto">
            <h3 className="mb-4 text-lg font-semibold">{t("yearly")}</h3>
            <div className="grid gap-5 lg:grid-cols-2">
              {subscriptionYearly.map((tier) => {
                const planKey = tier.plan as "basic" | "pro";
                return (
                  <article
                    key={tier.id}
                    className={`relative flex h-full flex-col rounded-lg border bg-card p-6 shadow-sm ${
                      tier.featured
                        ? "border-primary ring-1 ring-primary"
                        : ""
                    }`}
                  >
                    {tier.featured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                        {tp("mostPopular")}
                      </span>
                    )}
                    <h4 className="text-xl font-semibold">
                      {t(`subscriptions.${planKey}.name`)}
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(`subscriptions.${planKey}.description`)}
                    </p>
                    <p className="mt-4 text-4xl font-bold">
                      ${tier.priceValue}
                      <span className="ml-1 text-base font-normal text-muted-foreground">
                        {tp("perYear")}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tier.creditAmount} {tp("credits")}{tp("perYear")}
                    </p>
                    <ul className="mt-5 flex-1 space-y-2.5">
                      {(["feature1", "feature2", "feature3"] as const).map(
                        (fk) => (
                          <li
                            key={fk}
                            className="flex gap-2 text-sm text-muted-foreground"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            {t(`subscriptions.${planKey}.${fk}`)}
                          </li>
                        )
                      )}
                    </ul>
                    <div className="mt-6">
                      <PricingBuyButton
                        tierId={tier.id}
                        locale={locale}
                        featured={tier.featured}
                        managePlan={
                          accountSummary?.hasActiveSubscription &&
                          accountSummary.plan === tier.plan
                        }
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t py-16">
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
