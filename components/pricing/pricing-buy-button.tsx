"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";

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
      router.push(locale === "en" ? "/sign-in" : `/${locale}/sign-in`);
      return;
    }

    setIsProcessing(true);
    try {
      const response = managePlan
        ? await fetch("/api/creem/customer-portal")
        : await fetch("/api/creem/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tierId }),
          });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create checkout");
      }

      const data = await response.json();
      const redirectUrl = managePlan ? data.customer_portal_link : data.checkoutUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Payment failed",
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
