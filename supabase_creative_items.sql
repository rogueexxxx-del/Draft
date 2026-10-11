-- Run this once in the Supabase SQL editor to enable scrapbook, shot list, and script sync.
create table if not exists public.creative_items (
  id uuid primary key,
  kind text not null check (kind in ('scrapbook', 'shot', 'script')),
  title text not null default 'Untitled',
  data jsonb not null default '{}'::jsonb,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creative_items_owner_kind_created_idx
  on public.creative_items (user_id, kind, created_at desc);

alter table public.creative_items enable row level security;

create policy "Owners can read creative items" on public.creative_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners can add creative items" on public.creative_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owners can edit creative items" on public.creative_items
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Owners can remove creative items" on public.creative_items
  for delete to authenticated using ((select auth.uid()) = user_id);

-- New Supabase projects may require explicit Data API grants.
grant select, insert, update, delete on public.creative_items to authenticated;
