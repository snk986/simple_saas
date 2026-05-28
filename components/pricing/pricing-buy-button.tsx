"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { trackFunnelEvent } from "@/lib/analytics/funnel-client";

interface PricingBuyButtonProps {
  tierId: string;
  locale: Locale;
  featured?: boolean;
  managePlan?: boolean;
}

export function PricingBuyButton({
  tierId,
  locale,
  featured,
  managePlan,
}: PricingBuyButtonProps) {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const t = useTranslations("pricing");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    if (!user) {
      trackFunnelEvent("checkout_auth_required", {
        tier_id: tierId,
        locale,
        route: window.location.pathname,
      });
      router.push(locale === "en" ? "/sign-in" : `/${locale}/sign-in`);
      return;
    }

    setIsProcessing(true);
    try {
      if (!managePlan) {
        trackFunnelEvent("checkout_start", {
          tier_id: tierId,
          locale,
          route: window.location.pathname,
        });
      }

      const response = managePlan
        ? await fetch("/api/creem/customer-portal")
        : await fetch("/api/creem/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tierId }),
          });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || t("checkoutFailed"));
      }

      const data = await response.json();
      const redirectUrl = managePlan
        ? data.customer_portal_link
        : data.checkoutUrl;
      if (redirectUrl) {
        if (!managePlan) {
          trackFunnelEvent("checkout_redirect", {
            tier_id: tierId,
            locale,
            route: window.location.pathname,
          });
        }
        window.location.href = redirectUrl;
      }
    } catch (error) {
      if (!managePlan) {
        trackFunnelEvent("checkout_failed", {
          tier_id: tierId,
          locale,
          route: window.location.pathname,
        });
      }
      toast({
        title: t("errorTitle"),
        description:
          error instanceof Error ? error.message : t("paymentFailed"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      className="w-full"
      variant={featured ? "default" : "outline"}
      onClick={handlePurchase}
      disabled={isProcessing}
    >
      {isProcessing
        ? "..."
        : managePlan && user
          ? t("managePlan")
          : user
            ? t("getStarted")
            : t("signInToBuy")}
    </Button>
  );
}
