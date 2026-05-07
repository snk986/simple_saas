import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { CreemCheckout, CreemSubscription, CreemWebhookEvent } from "@/types/creem";
import {
  addCreditsToCustomer,
  checkoutCreditGrantKey,
  createOrUpdateCustomer,
  createOrUpdateSubscription,
  getTierCreditAmount,
  getTierFromMetadata,
  getTierFromProductId,
  subscriptionCreditGrantKey,
} from "@/utils/supabase/subscriptions";

const CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET;

function parseSignature(signature: string) {
  const v1 = signature
    .split(",")
    .map((part) => part.trim())
    .find((part) => part.startsWith("v1="));

  return v1 ? v1.slice(3) : signature.trim();
}

function isValidSignature(body: string, signature: string) {
  if (!CREEM_WEBHOOK_SECRET || !signature) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", CREEM_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  const provided = parseSignature(signature);

  if (provided.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(provided, "utf8"),
    Buffer.from(expected, "utf8")
  );
}

function getProductId(product: CreemCheckout["product"] | CreemSubscription["product"]) {
  return typeof product === "string" ? product : product?.id;
}

function subscriptionWithCheckoutMetadata(
  subscription: CreemSubscription,
  checkoutMetadata: Record<string, any> | undefined
) {
  return {
    ...subscription,
    metadata: {
      ...(checkoutMetadata ?? {}),
      ...(subscription.metadata ?? {}),
    },
  };
}

async function grantSubscriptionCredits(
  customerId: string,
  subscription: CreemSubscription,
  sourceEventId: string
) {
  const productId = getProductId(subscription.product);
  const tier =
    getTierFromMetadata(subscription.metadata) ?? getTierFromProductId(productId);
  const creditAmount = getTierCreditAmount(tier, subscription.metadata?.credit_amount);

  if (creditAmount <= 0) {
    return;
  }

  const creditGrantKey =
    subscription.current_period_start_date && subscription.current_period_end_date
      ? subscriptionCreditGrantKey(subscription)
      : `subscription:${subscription.id}:${sourceEventId}`;

  await addCreditsToCustomer(
    customerId,
    creditAmount,
    creditGrantKey,
    `${tier?.name ?? "Subscription"} credits`,
    {
      event_id: sourceEventId,
      tier_id: tier?.id ?? subscription.metadata?.tier_id,
      product_id: productId,
      billing_period: tier?.billingPeriod ?? subscription.metadata?.billing_period,
      product_type: "subscription",
    }
  );
}

async function handleCheckoutCompleted(event: CreemWebhookEvent) {
  const checkout = event.object as CreemCheckout;
  const metadata = checkout.metadata ?? checkout.order?.metadata ?? {};

  if (!metadata.user_id) {
    throw new Error("Missing user_id in checkout metadata");
  }

  const customerId = await createOrUpdateCustomer(checkout.customer, metadata.user_id);
  const tier =
    getTierFromMetadata(metadata) ?? getTierFromProductId(getProductId(checkout.product));

  if (metadata.product_type === "credits") {
    const creditAmount = getTierCreditAmount(tier, metadata.credit_amount ?? metadata.credits);

    if (creditAmount <= 0) {
      throw new Error("Credit amount is missing from checkout metadata");
    }

    await addCreditsToCustomer(
      customerId,
      creditAmount,
      checkoutCreditGrantKey(checkout.id, checkout.order?.id),
      `${tier?.name ?? "Credit pack"} purchase`,
      {
        event_id: event.id,
        checkout_id: checkout.id,
        tier_id: tier?.id ?? metadata.tier_id,
        product_id: getProductId(checkout.product),
        product_type: "credits",
      }
    );
  }

  if (checkout.subscription) {
    const subscription = subscriptionWithCheckoutMetadata(
      checkout.subscription,
      metadata
    );

    await createOrUpdateSubscription(subscription, customerId);
    await grantSubscriptionCredits(customerId, subscription, event.id);
  }
}

async function handleSubscriptionUpdate(event: CreemWebhookEvent, grantCredits: boolean) {
  const subscription = event.object as CreemSubscription;
  const customerId = await createOrUpdateCustomer(
    subscription.customer,
    subscription.metadata?.user_id
  );

  await createOrUpdateSubscription(subscription, customerId);

  if (grantCredits) {
    await grantSubscriptionCredits(customerId, subscription, event.id);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = (await headers()).get("creem-signature") || "";

    if (!isValidSignature(body, signature)) {
      console.error("Invalid Creem webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body) as CreemWebhookEvent;
    console.log("Received Creem webhook event:", event.eventType, event.object?.id);

    switch (event.eventType) {
      case "checkout.completed":
        await handleCheckoutCompleted(event);
        break;
      case "subscription.active":
        await handleSubscriptionUpdate(event, false);
        break;
      case "subscription.paid":
        await handleSubscriptionUpdate(event, true);
        break;
      case "subscription.canceled":
      case "subscription.expired":
      case "subscription.unpaid":
      case "subscription.update":
      case "subscription.trialing":
        await handleSubscriptionUpdate(event, false);
        break;
      default:
        console.log("Unhandled Creem webhook event:", event.eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(
      "Error processing Creem webhook:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
