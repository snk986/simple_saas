import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { creem } from '@/lib/creem';
import { getTierById } from '@/config/subscriptions';
import { defaultLocale, isLocale, type Locale } from '@/i18n/routing';
import crypto from "crypto";

function inferLocaleFromRequest(request: Request): Locale {
  const referer = request.headers.get("referer");

  if (!referer) {
    return defaultLocale;
  }

  try {
    const [, maybeLocale] = new URL(referer).pathname.split("/");
    return maybeLocale && isLocale(maybeLocale) ? maybeLocale : defaultLocale;
  } catch {
    return defaultLocale;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const allowedKeys = ["tierId"];

    if (
      !body ||
      typeof body !== "object" ||
      Object.keys(body).some((key) => !allowedKeys.includes(key))
    ) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const tierId = typeof body?.tierId === "string" ? body.tierId : "";
    const locale = inferLocaleFromRequest(request);
    const tier = getTierById(tierId);

    if (!tier) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!tier.productId) {
      return NextResponse.json(
        { error: "Payment plan is not configured" },
        { status: 500 }
      );
    }

    const origin = request.headers.get("origin") ?? process.env.BASE_URL ?? "";
    const successUrl =
      process.env.CREEM_SUCCESS_URL ||
      `${origin}${locale === "en" ? "" : `/${locale}`}/create?upgraded=true`;

    const checkout = await creem.checkouts.create({
      productId: tier.productId,
      customer: {
        email: user.email,
      },
      successUrl,
      metadata: {
        user_id: user.id,
        tier_id: tier.id,
        plan: tier.plan,
        billing_period: tier.billingPeriod,
        credit_amount: tier.creditAmount,
        product_type: tier.billingPeriod === "one_time" ? "credits" : "subscription",
        locale,
        idempotency_key: crypto.randomUUID(),
      }
    });

    return NextResponse.json({ checkoutUrl: checkout.checkoutUrl });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
