"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface PricingBuyButtonProps {
  tierId: string;
  featured?: boolean;
}

export function PricingBuyButton({ tierId, featured }: PricingBuyButtonProps) {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const t = useTranslations("pricing");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    if (!user) {
      router.push("/sign-in");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/creem/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create checkout");
      }

      const { checkoutUrl } = await response.json();
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
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
      {isProcessing ? "..." : user ? t("getStarted") : t("signInToBuy")}
    </Button>
  );
}
