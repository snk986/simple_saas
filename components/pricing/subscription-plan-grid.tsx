"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PricingBuyButton } from "@/components/pricing/pricing-buy-button";
import type { Locale } from "@/i18n/routing";

type PlanData = {
  tierId: string;
  priceValue: number;
  songs: number;
};

interface SubscriptionPlanGridProps {
  locale: Locale;
  createHref: string;
  manageBasic: boolean;
  managePro: boolean;
  basicMonthly: PlanData;
  basicYearly: PlanData;
  proMonthly: PlanData;
  proYearly: PlanData;
  t: (key: string) => string;
  tp: (key: string) => string;
}

export function SubscriptionPlanGrid({
  locale,
  createHref,
  manageBasic,
  managePro,
  basicMonthly,
  basicYearly,
  proMonthly,
  proYearly,
  t,
  tp,
}: SubscriptionPlanGridProps) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const basic = useMemo(
    () => (billing === "monthly" ? basicMonthly : basicYearly),
    [billing, basicMonthly, basicYearly],
  );
  const pro = useMemo(
    () => (billing === "monthly" ? proMonthly : proYearly),
    [billing, proMonthly, proYearly],
  );

  return (
    <div className="mx-auto mt-7 max-w-6xl rounded-2xl border bg-card p-4 shadow-sm md:p-5">
      <div className="mb-4 flex items-center justify-center">
        <div className="inline-flex rounded-full border bg-background p-1">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              billing === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t("monthly")}
          </button>
          <button
            type="button"
            onClick={() => setBilling("yearly")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              billing === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t("yearly")}
          </button>
          <span className="ml-1 inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            {t("save69")}
          </span>
        </div>
      </div>
      <p className="mb-4 text-center text-sm text-foreground">{t("subscribeNowCancelAnytime")}</p>

      <div className="grid gap-3 lg:grid-cols-3">
        <article className="flex h-full flex-col rounded-xl border bg-background p-4">
          <h4 className="text-lg font-semibold">{t("subscriptions.basic.name")}</h4>
          <p className="mt-1 text-xs text-muted-foreground">{t("subscriptions.basic.description")}</p>
          <p className="mt-3 text-3xl font-bold">
            ${basic.priceValue}
            <span className="ml-1 text-base font-normal text-muted-foreground">
              {billing === "monthly" ? tp("perMonth") : tp("perYear")}
            </span>
          </p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {basic.songs} {t("songsUnit")}
            {billing === "monthly" ? tp("perMonth") : tp("perYear")}
          </p>
          <div className="mt-3">
            <PricingBuyButton tierId={basic.tierId} locale={locale} managePlan={manageBasic} />
          </div>
          <ul className="mt-3 flex-1 space-y-2">
            {(["feature1", "feature2", "feature3"] as const).map((fk) => (
              <li key={fk} className="flex gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {t(`subscriptions.basic.${fk}`)}
              </li>
            ))}
          </ul>
        </article>

        <article className="flex h-full flex-col rounded-xl border-2 border-primary bg-background p-4 shadow-sm shadow-primary/20">
          <h4 className="text-lg font-semibold">{t("subscriptions.pro.name")}</h4>
          <p className="mt-1 text-xs text-muted-foreground">{t("subscriptions.pro.description")}</p>
          <p className="mt-3 text-3xl font-bold">
            ${pro.priceValue}
            <span className="ml-1 text-base font-normal text-muted-foreground">
              {billing === "monthly" ? tp("perMonth") : tp("perYear")}
            </span>
          </p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {pro.songs} {t("songsUnit")}
            {billing === "monthly" ? tp("perMonth") : tp("perYear")}
          </p>
          <div className="mt-3">
            <PricingBuyButton tierId={pro.tierId} locale={locale} featured managePlan={managePro} />
          </div>
          <ul className="mt-3 flex-1 space-y-2">
            {(["feature1", "feature2", "feature3"] as const).map((fk) => (
              <li key={fk} className="flex gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {t(`subscriptions.pro.${fk}`)}
              </li>
            ))}
          </ul>
        </article>

        <article className="flex h-full flex-col rounded-xl border bg-background p-4">
          <h4 className="text-lg font-semibold">{tp("freePlan")}</h4>
          <p className="mt-1 text-xs text-muted-foreground">{t("freeCard.description")}</p>
          <p className="mt-3 text-3xl font-bold">$0</p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{t("freeCard.creditHint")}</p>
          <Link
            href={createHref}
            className="mt-3 inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-accent"
          >
            {tp("getStarted")}
          </Link>
          <ul className="mt-3 flex-1 space-y-2">
            {(["feature1", "feature2", "feature3"] as const).map((fk) => (
              <li key={fk} className="flex gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {t(`freeCard.${fk}`)}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}

