"use client";

import {
  CreditCard,
  Package2,
  AlertCircle,
  Clock,
  Ban,
  PauseCircle,
  LucideIcon,
  Zap,
} from "lucide-react";
import { SubscriptionPortalDialog } from "./subscription-portal-dialog";
import { PlanTier, SubscriptionState } from "@/types/subscriptions";

type StatusConfig = {
  color: string;
  icon: LucideIcon;
  messageKey: keyof SubscriptionStatusLabels["statuses"];
  iconColor: string;
};

type StatusConfigs = {
  [key in SubscriptionState]: StatusConfig;
};

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale).format(new Date(date));
}

function isFutureDate(date: string) {
  return new Date(date) > new Date();
}

type SubscriptionStatusLabels = {
  currentPlan: string;
  freePlan: string;
  basicPlan: string;
  proPlan: string;
  storagePermanent: string;
  storageFree: string;
  priorityEnabled: string;
  priorityStandard: string;
  statuses: {
    active: string;
    trialing: string;
    canceledGrace: string;
    canceledEnded: string;
    pastDue: string;
    unpaid: string;
    paused: string;
    incomplete: string;
    expired: string;
    noActivePlan: string;
  };
  portal: {
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
};

function getStatusConfig(
  status: string,
  current_period_end: string,
): StatusConfig {
  const inGracePeriod = isFutureDate(current_period_end);

  const configs: StatusConfigs = {
    active: {
      color: "text-green-500",
      icon: Package2,
      messageKey: "active",
      iconColor: "text-green-500",
    },
    trialing: {
      color: "text-primary",
      icon: Clock,
      messageKey: "trialing",
      iconColor: "text-primary",
    },
    canceled: {
      color: inGracePeriod ? "text-yellow-500" : "text-destructive",
      icon: Ban,
      messageKey: inGracePeriod ? "canceledGrace" : "canceledEnded",
      iconColor: inGracePeriod ? "text-yellow-500" : "text-destructive",
    },
    past_due: {
      color: "text-yellow-500",
      icon: AlertCircle,
      messageKey: "pastDue",
      iconColor: "text-yellow-500",
    },
    unpaid: {
      color: "text-destructive",
      icon: AlertCircle,
      messageKey: "unpaid",
      iconColor: "text-destructive",
    },
    paused: {
      color: "text-yellow-500",
      icon: PauseCircle,
      messageKey: "paused",
      iconColor: "text-yellow-500",
    },
    incomplete: {
      color: "text-yellow-500",
      icon: AlertCircle,
      messageKey: "incomplete",
      iconColor: "text-yellow-500",
    },
    expired: {
      color: "text-destructive",
      icon: Ban,
      messageKey: "expired",
      iconColor: "text-destructive",
    },
  };

  return (
    configs[status as SubscriptionState] || {
      color: "text-muted-foreground",
      icon: AlertCircle,
      messageKey: "noActivePlan",
      iconColor: "text-muted-foreground",
    }
  );
}

type SubscriptionStatusCardProps = {
  subscription?: {
    status: string;
    current_period_end: string;
    creem_product_id?: string | null;
  } | null;
  entitlements: {
    plan: PlanTier;
    priorityGeneration: boolean;
    canKeepSongsForever: boolean;
    subscriptionEndsAt: string | null;
  };
  locale: string;
  labels: SubscriptionStatusLabels;
  upgradeHref?: string;
};

function formatMessage(template: string, locale: string, date: string) {
  return template.replace("{date}", formatDate(date, locale));
}

export function SubscriptionStatusCard({
  subscription,
  entitlements,
  locale,
  labels,
  upgradeHref,
}: SubscriptionStatusCardProps) {
  const planLabel =
    entitlements.plan === "free"
      ? labels.freePlan
      : entitlements.plan === "basic"
        ? labels.basicPlan
        : labels.proPlan;

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm shadow-black/20">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{labels.currentPlan}</p>
          {subscription && (
            <h3
              className={`text-2xl font-bold capitalize mt-1 ${
                getStatusConfig(
                  subscription.status,
                  subscription.current_period_end,
                ).color
              }`}
            >
              {planLabel}
            </h3>
          )}
          {!subscription && (
            <h3 className="text-2xl font-bold mt-1 text-muted-foreground">
              {planLabel}
            </h3>
          )}
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Package2 className="h-4 w-4 text-primary" />
          <span>
            {entitlements.canKeepSongsForever
              ? labels.storagePermanent
              : labels.storageFree.replace("{days}", "30")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span>
            {entitlements.priorityGeneration
              ? labels.priorityEnabled
              : labels.priorityStandard}
          </span>
        </div>
      </div>
      {subscription && (
        <div className="mt-4 flex items-center text-sm gap-2">
          {(() => {
            const config = getStatusConfig(
              subscription.status,
              subscription.current_period_end,
            );
            const Icon = config.icon;
            const messageTemplate = labels.statuses[config.messageKey];
            const needsDate = messageTemplate.includes("{date}");
            return (
              <>
                <Icon className={`h-4 w-4 ${config.iconColor}`} />
                <span className="text-muted-foreground">
                  {needsDate
                    ? formatMessage(
                        messageTemplate,
                        locale,
                        subscription.current_period_end,
                      )
                    : messageTemplate}
                </span>
              </>
            );
          })()}
        </div>
      )}
      <div className="mt-4">
        <SubscriptionPortalDialog
          upgradeHref={upgradeHref}
          hasPortalCustomer={Boolean(subscription)}
          labels={labels.portal}
        />
      </div>
    </div>
  );
}
