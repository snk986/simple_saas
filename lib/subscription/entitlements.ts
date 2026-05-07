import { SUBSCRIPTION_TIERS } from "@/config/subscriptions";
import type { PlanTier, ProductTier } from "@/types/subscriptions";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

export type UserEntitlements = {
  plan: PlanTier;
  creditsBalance: number;
  songRetentionDays: number | null;
  priorityGeneration: boolean;
  canKeepSongsForever: boolean;
  subscriptionEndsAt: string | null;
};

const FREE_RETENTION_DAYS = 30;
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

function isSubscriptionEntitled(subscription?: {
  status: string | null;
  current_period_end: string | null;
}) {
  if (!subscription?.status) {
    return false;
  }

  if (ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    return true;
  }

  return (
    subscription.status === "canceled" &&
    !!subscription.current_period_end &&
    new Date(subscription.current_period_end).getTime() > Date.now()
  );
}

function getTierForSubscription(subscription?: {
  creem_product_id: string | null;
  metadata: Record<string, unknown> | null;
}) {
  const tierId =
    typeof subscription?.metadata?.tier_id === "string"
      ? subscription.metadata.tier_id
      : null;

  return SUBSCRIPTION_TIERS.find(
    (tier) =>
      tier.id === tierId ||
      (!!subscription?.creem_product_id &&
        tier.productId === subscription.creem_product_id),
  );
}

function buildEntitlements(input: {
  plan?: PlanTier | null;
  creditsBalance?: number | null;
  subscription?: {
    status: string | null;
    current_period_end: string | null;
    creem_product_id: string | null;
    metadata: Record<string, unknown> | null;
  };
}): UserEntitlements {
  const entitled = isSubscriptionEntitled(input.subscription);
  const tier: ProductTier | undefined = entitled
    ? getTierForSubscription(input.subscription)
    : undefined;
  const plan = entitled ? tier?.plan ?? input.plan ?? "free" : "free";
  const normalizedPlan: PlanTier = plan === "free" ? "free" : plan;
  const songRetentionDays =
    normalizedPlan === "free" ? FREE_RETENTION_DAYS : tier?.songRetentionDays ?? null;

  return {
    plan: normalizedPlan,
    creditsBalance: input.creditsBalance ?? 0,
    songRetentionDays,
    priorityGeneration: normalizedPlan !== "free" && Boolean(tier?.priorityGeneration),
    canKeepSongsForever: songRetentionDays === null,
    subscriptionEndsAt: entitled ? input.subscription?.current_period_end ?? null : null,
  };
}

export async function getUserEntitlements(userId: string): Promise<UserEntitlements> {
  const supabase = createServiceRoleClient();
  const { data: customer, error } = await supabase
    .from("customers")
    .select(
      `
      plan,
      credits_balance,
      subscriptions (
        status,
        current_period_end,
        creem_product_id,
        metadata
      )
    `,
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const subscriptions = Array.isArray(customer?.subscriptions)
    ? [...customer.subscriptions].sort((a, b) => {
        const left = a.current_period_end
          ? new Date(a.current_period_end).getTime()
          : 0;
        const right = b.current_period_end
          ? new Date(b.current_period_end).getTime()
          : 0;
        return right - left;
      })
    : [];
  const entitledSubscription =
    subscriptions.find((subscription) => isSubscriptionEntitled(subscription)) ??
    subscriptions[0];

  return buildEntitlements({
    plan: (customer?.plan as PlanTier | null) ?? "free",
    creditsBalance: customer?.credits_balance ?? 0,
    subscription: entitledSubscription,
  });
}

export function getSongExpiryForEntitlements(
  entitlements: UserEntitlements,
  from = new Date(),
) {
  if (entitlements.canKeepSongsForever || entitlements.songRetentionDays === null) {
    return null;
  }

  const expiresAt = new Date(from);
  expiresAt.setDate(expiresAt.getDate() + entitlements.songRetentionDays);
  return expiresAt.toISOString();
}
