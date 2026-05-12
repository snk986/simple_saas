import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { creem } from "@/lib/creem";

export async function GET(_request: Request) {
  try {
    // Get the user from the session
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client for database operations
    const serviceClient = createServiceRoleClient();

    // Get the customer record for this user
    const { data: customer, error: customerError } = await serviceClient
      .from("customers")
      .select("creem_customer_id")
      .eq("user_id", user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    // Check if the customer ID is a valid Creem ID (should start with 'cust_')
    // The 'auto_' IDs are local placeholders for new users and don't exist in Creem
    if (!customer.creem_customer_id || !customer.creem_customer_id.startsWith('cust_')) {
      return NextResponse.json({ error: "Not a paid customer yet" }, { status: 404 });
    }

    const data = await creem.customers.generateBillingLinks({
      customerId: customer.creem_customer_id,
    });

    return NextResponse.json({
      customer_portal_link:
        data.customerPortalLink ??
        (data as { customer_portal_link?: string; url?: string }).customer_portal_link ??
        (data as { customer_portal_link?: string; url?: string }).url,
    });
  } catch (error) {
    console.error("Error getting customer portal link:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
