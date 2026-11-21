-- Абонаменти на бизнесите (2026-11-21). Засега само се записва кой какво е
-- платил; нищо не се заключва. Един план „basic“ за 10 € на месец; втори
-- („plus“) е обявен в портала като „очаквайте скоро“.
--
-- Отделна таблица, а не колони в business_platform_settings: настройките на
-- активните бизнеси се четат анонимно (open_override, content_version), а
-- Stripe номерата и датите на плащане не са публични. Пишат само админът и
-- сървърът (service role: връщането от Stripe и webhook-ът).

create table if not exists public.business_billing (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  plan text not null default 'basic' check (plan in ('basic', 'plus')),
  paid_until date,
  subscription_status text not null default 'none'
    check (subscription_status in ('none', 'active', 'canceling', 'canceled', 'past_due')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  updated_at timestamptz not null default now()
);

create table if not exists public.business_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  plan text not null default 'basic' check (plan in ('basic', 'plus')),
  source text not null check (source in ('stripe_subscription', 'stripe_one_time', 'manual')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'EUR',
  months integer not null default 1 check (months between 1 and 24),
  period_start date not null,
  period_end date not null,
  stripe_session_id text unique,
  stripe_invoice_id text unique,
  note text not null default '' check (char_length(note) <= 300),
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists business_payments_business_idx on public.business_payments (business_id, created_at desc);

alter table public.business_billing enable row level security;
alter table public.business_payments enable row level security;

drop policy if exists "Members read billing" on public.business_billing;
create policy "Members read billing" on public.business_billing
  for select to authenticated
  using ((business_id in (select public.member_business_ids())) or (select public.is_admin()));

drop policy if exists "Admin writes billing" on public.business_billing;
create policy "Admin writes billing" on public.business_billing
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Members read payments" on public.business_payments;
create policy "Members read payments" on public.business_payments
  for select to authenticated
  using ((business_id in (select public.member_business_ids())) or (select public.is_admin()));

drop policy if exists "Admin writes payments" on public.business_payments;
create policy "Admin writes payments" on public.business_payments
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select, insert, update, delete on public.business_billing, public.business_payments to authenticated;
revoke all on public.business_billing, public.business_payments from anon;

drop trigger if exists set_business_billing_updated_at on public.business_billing;
create or replace function public.set_business_billing_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger set_business_billing_updated_at before update on public.business_billing
  for each row execute function public.set_business_billing_updated_at();
revoke execute on function public.set_business_billing_updated_at() from public, anon, authenticated;
