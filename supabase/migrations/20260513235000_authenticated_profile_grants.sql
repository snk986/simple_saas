-- Ensure authenticated users can read their own billing/credits data under RLS.
grant select on public.customers to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.credits_history to authenticated;
