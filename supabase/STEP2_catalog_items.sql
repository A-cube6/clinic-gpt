-- STEP 2: Item catalog table (used by Shop; owner manages, public can read active items)

create extension if not exists "uuid-ossp";

create table if not exists public.catalog_items (
  id uuid primary key default uuid_generate_v4(),
  sku text not null unique,
  name text not null,
  price_inr int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.catalog_items enable row level security;

-- Owner full access
drop policy if exists "catalog_owner_all" on public.catalog_items;
create policy "catalog_owner_all" on public.catalog_items
for all
using (public.is_owner(auth.uid()))
with check (public.is_owner(auth.uid()));

-- Public can read only active items (for website shop listing)
drop policy if exists "catalog_public_select_active" on public.catalog_items;
create policy "catalog_public_select_active" on public.catalog_items
for select
using (active = true);
