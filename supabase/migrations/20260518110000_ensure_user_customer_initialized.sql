-- Ensure user customer record + welcome credits are initialized even if auth trigger is missing.

create or replace function public.ensure_user_customer_initialized(
  p_user_id uuid,
  p_email text default null,
  p_reason text default 'unknown'
)
returns json as $$
declare
  v_customer_id uuid;
  v_email text;
  v_welcome_key text;
  v_created_customer boolean := false;
  v_granted_welcome boolean := false;
  v_balance integer := 0;
begin
  if p_user_id is null then
    raise exception 'user_id is required';
  end if;

  v_welcome_key := 'welcome:' || p_user_id::text;

  select id
    into v_customer_id
  from public.customers
  where user_id = p_user_id
  limit 1;

  if v_customer_id is null then
    select lower(
      coalesce(
        nullif(btrim(p_email), ''),
        (select email from auth.users where id = p_user_id)
      )
    )
      into v_email;

    if v_email is null then
      raise exception 'user email is required to initialize customer';
    end if;

    insert into public.customers (
      user_id,
      email,
      credits,
      credits_balance,
      creem_customer_id,
      created_at,
      updated_at,
      metadata
    ) values (
      p_user_id,
      v_email,
      300,
      300,
      'auto_' || p_user_id::text,
      now(),
      now(),
      jsonb_build_object(
        'source', 'ensure_user_customer_initialized',
        'initial_credits', 300,
        'reason', p_reason
      )
    )
    returning id into v_customer_id;

    v_created_customer := true;
    v_granted_welcome := true;

    insert into public.credits_history (
      customer_id,
      amount,
      type,
      description,
      creem_order_id,
      created_at,
      metadata
    ) values (
      v_customer_id,
      300,
      'add',
      'Welcome bonus for new user registration',
      v_welcome_key,
      now(),
      jsonb_build_object(
        'source', 'welcome_bonus',
        'reason', p_reason
      )
    );
  else
    if not exists (
      select 1
      from public.credits_history
      where customer_id = v_customer_id
        and creem_order_id = v_welcome_key
    ) then
      update public.customers
      set
        credits_balance = coalesce(credits_balance, 0) + 300,
        credits = coalesce(credits, 0) + 300,
        updated_at = now(),
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
          'welcome_bonus_repair_reason', p_reason,
          'welcome_bonus_repaired_at', now()
        )
      where id = v_customer_id
        and coalesce(credits_balance, 0) = 0
        and coalesce(credits, 0) = 0;

      if found then
        v_granted_welcome := true;
        insert into public.credits_history (
          customer_id,
          amount,
          type,
          description,
          creem_order_id,
          created_at,
          metadata
        ) values (
          v_customer_id,
          300,
          'add',
          'Welcome bonus repair',
          v_welcome_key,
          now(),
          jsonb_build_object(
            'source', 'welcome_bonus_repair',
            'reason', p_reason
          )
        );
      end if;
    end if;
  end if;

  select coalesce(credits_balance, 0)
    into v_balance
  from public.customers
  where id = v_customer_id;

  return json_build_object(
    'customer_id', v_customer_id,
    'created_customer', v_created_customer,
    'granted_welcome', v_granted_welcome,
    'balance', coalesce(v_balance, 0)
  );
exception
  when unique_violation then
    select id, coalesce(credits_balance, 0)
      into v_customer_id, v_balance
    from public.customers
    where user_id = p_user_id
    limit 1;

    return json_build_object(
      'customer_id', v_customer_id,
      'created_customer', false,
      'granted_welcome', false,
      'balance', coalesce(v_balance, 0)
    );
end;
$$ language plpgsql security definer set search_path = public, auth;

grant execute on function public.ensure_user_customer_initialized(uuid, text, text)
  to authenticated, service_role;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
      and not tgisinternal
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end
$$;
