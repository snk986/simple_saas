import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type CustomerCredits = {
  id: string;
  user_id: string;
  credits_balance: number | null;
  credits_used: number | null;
  created_at: string;
  updated_at: string;
};

function toCreditsResponse(customer: CustomerCredits) {
  const balance = customer.credits_balance ?? 0;

  return {
    id: customer.id,
    user_id: customer.user_id,
    total_credits: balance + (customer.credits_used ?? 0),
    remaining_credits: balance,
    created_at: customer.created_at,
    updated_at: customer.updated_at,
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: customer, error } = await supabase
      .from("customers")
      .select("id,user_id,credits_balance,credits_used,created_at,updated_at")
      .eq("user_id", user.id)
      .single();

    if (error || !customer) {
      console.error("Error fetching customer credits:", error);
      return NextResponse.json(
        { error: "Failed to fetch customer data" },
        { status: 500 },
      );
    }

    return NextResponse.json({ credits: toCreditsResponse(customer) });
  } catch (error) {
    console.error("Credits API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { amount, operation } = payload as {
      amount?: unknown;
      operation?: unknown;
    };
    const creditAmount = Number(amount);

    if (!Number.isInteger(creditAmount) || creditAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid credit amount" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const description =
      typeof operation === "string" && operation.trim()
        ? operation.trim()
        : "credit_spend";
    const { data: creditResult, error: spendError } = await supabase.rpc(
      "freeze_credit",
      {
        p_user_id: user.id,
        p_amount: creditAmount,
        p_description: description,
        p_metadata: { operation: description },
      },
    );

    if (spendError) {
      console.error("Error spending credits:", spendError);
      return NextResponse.json(
        { error: "Failed to spend credits" },
        { status: 500 },
      );
    }

    if (!Boolean((creditResult as { enough?: boolean } | null)?.enough)) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 },
      );
    }

    const { data: customer, error } = await supabase
      .from("customers")
      .select("id,user_id,credits_balance,credits_used,created_at,updated_at")
      .eq("user_id", user.id)
      .single();

    if (error || !customer) {
      console.error("Error fetching updated customer credits:", error);
      return NextResponse.json(
        { error: "Failed to fetch customer data" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      credits: toCreditsResponse(customer),
      success: true,
    });
  } catch (error) {
    console.error("Credits spend API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
