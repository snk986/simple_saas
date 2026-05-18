import { createServiceRoleClient } from "@/utils/supabase/service-role";

type EnsureCustomerInitResult = {
  customer_id?: string;
  created_customer?: boolean;
  granted_welcome?: boolean;
  balance?: number;
};

export async function ensureCustomerInitialized(
  userId: string,
  email: string | null | undefined,
  reason: string,
) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("ensure_user_customer_initialized", {
    p_user_id: userId,
    p_email: email ?? null,
    p_reason: reason,
  });

  if (error) {
    throw error;
  }

  return (data ?? null) as EnsureCustomerInitResult | null;
}
