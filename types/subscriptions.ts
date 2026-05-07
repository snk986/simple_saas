export type BillingPeriod = "one_time" | "monthly" | "yearly";
export type PlanTier = "free" | "basic" | "pro";

export interface ProductTier {
  name: string;
  id: string;
  productId: string;
  price: string;
  priceValue: number;
  billingPeriod: BillingPeriod;
  plan: PlanTier;
  description: string;
  featured: boolean;
  features?: string[];
  creditAmount: number;
  songRetentionDays: number | null;
  priorityGeneration: boolean;
  reportCreditsIncluded: boolean;
  discountCode?: string;
}

export type SubscriptionStatus = {
  isSubscribed: boolean;
  status: string | null;
  willEndOn: Date | null;
  isInGracePeriod: boolean;
  daysLeft: number | null;
};

export type SubscriptionState =
  | "active"
  | "trialing"
  | "canceled"
  | "past_due"
  | "unpaid"
  | "paused"
  | "incomplete"
  | "expired";

export const ACTIVE_STATUSES = ["active", "trialing"] as const;
export const GRACE_PERIOD_STATUSES = [
  "canceled",
  "past_due",
  "unpaid",
  "paused",
] as const;
