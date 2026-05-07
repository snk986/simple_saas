-- Phase 4 Task 15: idempotent Creem payments and subscription plans

alter table public.customers
  add column if not exists credits_balance integer not null default 0,
  add column if not exists credits_used integer not null default 0,
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'basic', 'pro', 'enterprise'));

update public.customers
set credits_balance = greatest(coalesce(credits_balance, 0), coalesce(credits, 0))
where true;

create unique index if not exists credits_history_creem_order_id_unique
  on public.credits_history (creem_order_id)
  where creem_order_id is not null;

create or replace function public.grant_credits_once(
  p_customer_id uuid,
  p_amount integer,
  p_creem_order_id text,
  p_description text default 'Credits granted',
  p_metadata jsonb default '{}'::jsonb
)
returns json as $$
declare
  v_new_balance integer;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Credit amount must be positive';
  end if;

  if p_creem_order_id is null or btrim(p_creem_order_id) = '' then
    raise exception 'Creem order id is required';
  end if;

  insert into public.credits_history (
    customer_id,
    amount,
    type,
    description,
    creem_order_id,
    metadata
  ) values (
    p_customer_id,
    p_amount,
    'add',
    p_description,
    p_creem_order_id,
    coalesce(p_metadata, '{}'::jsonb)
  );

  update public.customers
  set
    credits_balance = coalesce(credits_balance, 0) + p_amount,
    credits = coalesce(credits, 0) + p_amount,
    updated_at = now()
  where id = p_customer_id
  returning credits_balance into v_new_balance;

  return json_build_object(
    'applied', true,
    'balance', v_new_balance
  );
exception
  when unique_violation then
    select credits_balance into v_new_balance
    from public.customers
    where id = p_customer_id;

    return json_build_object(
      'applied', false,
      'balance', coalesce(v_new_balance, 0)
    );
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.grant_credits_once(uuid, integer, text, text, jsonb)
  to service_role;
