import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { creem } from "@/lib/creem";
import { getTierById } from "@/config/subscriptions";
import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import crypto from "crypto";
import { z } from "zod";
import {
  getClientContext,
  getRequestId,
  logError,
  logInfo,
} from "@/lib/observability/log";
import { invalidJsonRequest, validationError } from "@/lib/api/errors";

const requestSchema = z
  .object({
    tierId: z.string().trim().min(1),
  })
  .strict();

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
  const requestId = getRequestId(request.headers.get("x-request-id"));
  const client = getClientContext(request.headers.get("user-agent"));
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logError("checkout_failed", {
        request_id: requestId,
        stage: "checkout",
        status: "failed",
        failure_reason: "unauthorized",
        ...client,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json().catch(() => null);

    if (!payload) {
      logError("checkout_failed", {
        request_id: requestId,
        user_id: user.id,
        stage: "checkout",
        status: "failed",
        failure_reason: "invalid_json",
        ...client,
      });
      return invalidJsonRequest();
    }

    const body = requestSchema.safeParse(payload);

    if (!body.success) {
      logError("checkout_failed", {
        request_id: requestId,
        user_id: user.id,
        stage: "checkout",
        status: "failed",
        failure_reason: "invalid_request",
        ...client,
      });
      return validationError(body.error);
    }

    const tierId = body.data.tierId;
    const locale = inferLocaleFromRequest(request);
    const tier = getTierById(tierId);

    if (!tier) {
      logError("checkout_failed", {
        request_id: requestId,
        user_id: user.id,
        stage: "checkout",
        status: "failed",
        failure_reason: "invalid_plan",
        ...client,
      });
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!tier.productId) {
      logError("checkout_failed", {
        request_id: requestId,
        user_id: user.id,
        stage: "checkout",
        status: "failed",
        failure_reason: "product_not_configured",
        ...client,
      });
      return NextResponse.json(
        { error: "Payment plan is not configured" },
        { status: 500 },
      );
    }

    logInfo("checkout_start", {
      request_id: requestId,
      user_id: user.id,
      stage: "checkout",
      status: "started",
      tier_id: tier.id,
      ...client,
    });

    const origin = request.headers.get("origin") ?? process.env.BASE_URL ?? "";
    const successUrl =
      process.env.CREEM_SUCCESS_URL ||
      `${origin}${locale === "en" ? "" : `/${locale}`}/ai-song-maker?upgraded=true`;

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
        product_type:
          tier.billingPeriod === "one_time" ? "credits" : "subscription",
        locale,
        idempotency_key: crypto.randomUUID(),
      },
    });

    return NextResponse.json({
      request_id: requestId,
      checkoutUrl:
        checkout.checkoutUrl ??
        (checkout as { checkout_url?: string }).checkout_url,
    });
  } catch (error) {
    logError("checkout_failed", {
      request_id: requestId,
      stage: "checkout",
      status: "failed",
      failure_reason: error instanceof Error ? error.message : String(error),
      ...client,
    });
    return NextResponse.json(
      { error: "Checkout creation failed", request_id: requestId },
      { status: 500 },
    );
  }
}
