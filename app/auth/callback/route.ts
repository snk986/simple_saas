import { createClient } from "@/utils/supabase/server";
import { ensureCustomerInitialized } from "@/lib/auth/ensure-customer-initialized";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      try {
        await ensureCustomerInitialized(user.id, user.email, "auth_callback");
      } catch (error) {
        console.error("Failed to ensure customer initialization:", error);
      }
    }
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // URL to redirect to after auth callback completes without explicit redirect target.
  return NextResponse.redirect(`${origin}/`);
}
