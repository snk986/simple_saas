import { createServiceRoleClient } from "./service-role";
import { CreemCustomer, CreemSubscription } from "@/types/creem";
import { getTierById, SUBSCRIPTION_TIERS } from "@/config/subscriptions";
import type { PlanTier, ProductTier } from "@/types/subscriptions";

export async function createOrUpdateCustomer(
  creemCustomer: CreemCustomer | string,
  userId?: string
) {
  const supabase = createServiceRoleClient();

  let existingCustomer = null;
  const creemCustomerId =
    typeof creemCustomer === "string" ? creemCustomer : creemCustomer.id;

  // 1. Try finding by user_id if provided
  // This handles the transition from 'auto_' ID to 'cust_' ID
  if (userId) {
    const { data, error } = await supabase
      .from("customers")
      .select()
      .eq("user_id", userId)
      .single();

    if (!error) {
      existingCustomer = data;
    } else if (error.code !== "PGRST116") {
      throw error;
    }
  }

  // 2. If not found by user_id (or user_id missing), try finding by creem_customer_id
  // This handles webhooks that might not have user_id metadata (e.g. renewals)
  if (!existingCustomer) {
    const { data, error } = await supabase
      .from("customers")
      .select()
      .eq("creem_customer_id", creemCustomerId)
      .single();

    if (!error) {
      existingCustomer = data;
    } else if (error.code !== "PGRST116") {
      throw error;
    }
  }

  if (existingCustomer) {
    if (typeof creemCustomer === "string") {
      return existingCustomer.id;
    }

    const { error } = await supabase
      .from("customers")
      .update({
        creem_customer_id: creemCustomer.id, // Ensure we have the latest Creem ID
        email: creemCustomer.email,
        name: creemCustomer.name,
        country: creemCustomer.country,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingCustomer.id);

    if (error) throw error;
    return existingCustomer.id;
  }

  // 3. If still not found, we need a user_id to create a new record
  if (!userId) {
    throw new Error("Cannot create customer: user_id is missing from webhook metadata");
  }

  if (typeof creemCustomer === "string") {
    throw new Error("Cannot create customer: Creem customer payload is incomplete");
  }

  const { data: newCustomer, error } = await supabase
    .from("customers")
    .insert({
      user_id: userId,
      creem_customer_id: creemCustomer.id,
      email: creemCustomer.email,
      name: creemCustomer.name,
      country: creemCustomer.country,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return newCustomer.id;
}

export async function createOrUpdateSubscription(
  creemSubscription: CreemSubscription,
  customerId: string
) {
  const supabase = createServiceRoleClient();

  const { data: existingSubscription, error: fetchError } = await supabase
    .from("subscriptions")
    .select()
    .eq("creem_subscription_id", creemSubscription.id)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw fetchError;
  }

  const subscriptionData = {
    customer_id: customerId,
    creem_product_id:
      typeof creemSubscription?.product === "string"
        ? creemSubscription?.product
        : creemSubscription?.product?.id,
    status: creemSubscription?.status,
    current_period_start:
      creemSubscription?.current_period_start_date ??
      creemSubscription?.created_at ??
      new Date().toISOString(),
    current_period_end:
      creemSubscription?.current_period_end_date ??
      creemSubscription?.created_at ??
      new Date().toISOString(),
    canceled_at: creemSubscription?.canceled_at,
    metadata: creemSubscription?.metadata ?? {},
    updated_at: new Date().toISOString(),
  };

  if (existingSubscription) {
    const { error } = await supabase
      .from("subscriptions")
      .update(subscriptionData)
      .eq("id", existingSubscription.id);

    if (error) throw error;
    await syncCustomerPlanFromSubscription(customerId, creemSubscription);
    return existingSubscription.id;
  }

  const { data: newSubscription, error } = await supabase
    .from("subscriptions")
    .insert({
      ...subscriptionData,
      creem_subscription_id: creemSubscription.id,
    })
    .select()
    .single();

  if (error) throw error;
  await syncCustomerPlanFromSubscription(customerId, creemSubscription);
  return newSubscription.id;
}

export function getTierFromMetadata(metadata?: Record<string, any> | null) {
  const tierId = typeof metadata?.tier_id === "string" ? metadata.tier_id : "";
  return getTierById(tierId);
}

export function getTierFromProductId(productId?: string | null) {
  if (!productId) return undefined;
  return SUBSCRIPTION_TIERS.find((tier) => tier.productId === productId);
}

export function subscriptionCreditGrantKey(subscription: CreemSubscription) {
  return [
    "subscription",
    subscription.id,
    subscription.current_period_start_date ?? "unknown-start",
    subscription.current_period_end_date ?? "unknown-end",
  ].join(":");
}

export function checkoutCreditGrantKey(checkoutId: string, orderId?: string) {
  return orderId || `checkout:${checkoutId}`;
}

export function getTierCreditAmount(tier: ProductTier | undefined, fallback?: unknown) {
  if (tier?.creditAmount) {
    return tier.creditAmount;
  }

  const parsed = Number(fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

async function syncCustomerPlanFromSubscription(
  customerId: string,
  subscription: CreemSubscription
) {
  const supabase = createServiceRoleClient();
  const productId =
    typeof subscription.product === "string"
      ? subscription.product
      : subscription.product?.id;
  const tier = getTierFromMetadata(subscription.metadata) ?? getTierFromProductId(productId);
  const periodEnd = subscription.current_period_end_date
    ? new Date(subscription.current_period_end_date)
    : null;
  const retainsCurrentPeriod =
    subscription.status === "canceled" && periodEnd && periodEnd.getTime() > Date.now();
  const activeLike =
    subscription.status === "active" ||
    subscription.status === "trialing" ||
    retainsCurrentPeriod;
  const plan: PlanTier = activeLike ? tier?.plan ?? "free" : "free";

  const { error } = await supabase
    .from("customers")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", customerId);

  if (error) throw error;
}

export async function getUserSubscription(userId: string) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      `
      *,
      customers!inner(user_id)
    `
    )
    .eq("customers.user_id", userId)
    .eq("status", "active")
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}

export async function addCreditsToCustomer(
  customerId: string,
  credits_balance: number,
  creemOrderId?: string,
  description?: string,
  metadata?: Record<string, unknown>
) {
  const supabase = createServiceRoleClient();
  if (!creemOrderId) {
    throw new Error("creemOrderId is required for idempotent credit grants");
  }

  const { data, error } = await supabase.rpc("grant_credits_once", {
    p_customer_id: customerId,
    p_amount: credits_balance,
    p_creem_order_id: creemOrderId,
    p_description: description || "Credits purchase",
    p_metadata: metadata ?? {},
  });

  if (error) throw error;

  return Number((data as { balance?: number } | null)?.balance ?? 0);
}

export async function useCredits(
  customerId: string,
  credits_balance: number,
  description: string
) {
  const supabase = createServiceRoleClient();

  const { data: client } = await supabase
    .from("customers")
    .select("user_id")
    .eq("id", customerId)
    .single();

  if (!client) throw new Error("Customer not found");

  const { data, error } = await supabase.rpc("freeze_credit", {
    p_user_id: client.user_id,
    p_amount: credits_balance,
    p_description: description,
    p_metadata: { source: "utils.supabase.subscriptions.useCredits" },
  });

  if (error) throw error;
  if (!Boolean((data as { enough?: boolean } | null)?.enough)) {
    throw new Error("Insufficient credits_balance");
  }

  return Number((data as { balance?: number } | null)?.balance ?? 0);
}

export async function getCustomerCredits(customerId: string) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("customers")
    .select("credits_balance")
    .eq("id", customerId)
    .single();

  if (error) throw error;
  return data?.credits_balance || 0;
}

export async function getCreditsHistory(customerId: string) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("credits_history")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
