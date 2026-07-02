-- 1. Create BUNDLES Table
create table public.bundles (
  id text not null,
  name text not null,
  description text,
  color text default '#DD400A',
  user_id uuid not null default auth.uid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint bundles_pkey primary key (id),
  constraint bundles_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- Enable RLS on bundles
alter table public.bundles enable row level security;

-- Create Policies for bundles
create policy "Users can select their own bundles"
  on public.bundles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bundles"
  on public.bundles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bundles"
  on public.bundles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own bundles"
  on public.bundles for delete
  using (auth.uid() = user_id);


-- 2. Create NOTES Table
create table public.notes (
  id text not null,
  title text default 'Untitled' not null,
  content text default '' not null,
  bundle_id text,
  grid_span text default 'col-span-1 row-span-1' not null,
  user_id uuid not null default auth.uid(),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint notes_pkey primary key (id),
  constraint notes_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint notes_bundle_id_fkey foreign key (bundle_id) references public.bundles (id) on delete set null
);

-- Enable RLS on notes
alter table public.notes enable row level security;

-- Create Policies for notes
create policy "Users can select their own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  using (auth.uid() = user_id);
