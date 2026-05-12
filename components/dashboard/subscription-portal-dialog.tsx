"use client";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowRight, CreditCard, Receipt, Settings } from "lucide-react";

export function SubscriptionPortalDialog({
  upgradeHref = "/pricing",
  hasPortalCustomer = false,
  labels,
}: {
  upgradeHref?: string;
  hasPortalCustomer?: boolean;
  labels: {
    viewPlans: string;
    managePlan: string;
    dialogTitle: string;
    dialogDescription: string;
    paymentMethodsTitle: string;
    paymentMethodsDescription: string;
    billingHistoryTitle: string;
    billingHistoryDescription: string;
    planSettingsTitle: string;
    planSettingsDescription: string;
    accessFailed: string;
    accessFailedDescription: string;
    redirecting: string;
    continueToPortal: string;
  };
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/creem/customer-portal");
      if (!response.ok) {
        throw new Error("Failed to get portal link");
      }

      const { customer_portal_link } = await response.json();
      window.open(customer_portal_link, "_blank");
    } catch (err) {
      console.error("Error getting portal link:", err);
      setError(`${labels.accessFailed} ${labels.accessFailedDescription}`.trim());
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasPortalCustomer) {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href={upgradeHref}>
          {labels.viewPlans}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          {labels.managePlan}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{labels.dialogTitle}</DialogTitle>
          <DialogDescription>
            {labels.dialogDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-6">
            {/* Portal Features */}
            <div className="grid gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{labels.paymentMethodsTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {labels.paymentMethodsDescription}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{labels.billingHistoryTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {labels.billingHistoryDescription}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{labels.planSettingsTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {labels.planSettingsDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        )}

        <DialogFooter className="flex space-x-2 sm:space-x-0">
          <Button onClick={handleManageSubscription} disabled={isLoading}>
            {isLoading ? labels.redirecting : labels.continueToPortal}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
