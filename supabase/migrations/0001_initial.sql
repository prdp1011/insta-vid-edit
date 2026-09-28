create extension if not exists "pgcrypto";

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  provider text not null check (provider in ('razorpay')),
  provider_subscription_id text not null unique,
  plan text not null,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
revoke all on public.subscriptions from anon, authenticated;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  platform text not null default 'instagram_reels',
  objective text,
  status text not null default 'draft',
  timeline jsonb,
  timeline_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;
create policy "Users own projects" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null,
  original_filename text not null,
  content_hash text not null,
  storage_key text not null unique,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.media_assets enable row level security;
create policy "Users own project assets" on public.media_assets for all using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())) with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create table if not exists public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null check (status in ('queued','processing','completed','failed')),
  progress numeric not null default 0 check (progress between 0 and 1),
  stage text,
  output_key text,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.render_jobs enable row level security;
create policy "Users own render jobs" on public.render_jobs for select using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
