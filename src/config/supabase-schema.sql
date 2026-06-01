-- Supabase SQL Schema for Attenary Auth-First Flow
-- Run this in Supabase Dashboard → SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (mirrors auth.users)
create table public.profiles (
  id                   uuid references auth.users(id) on delete cascade primary key,
  email                text unique not null,
  full_name            text,
  job_title            text,
  department           text,
  avatar_url           text,
  onboarding_completed boolean default false,
  language             text default 'en',
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Attendance sessions
create table public.sessions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  check_in_time timestamptz not null,
  check_out_time timestamptz,
  reason        text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Offline sync queue
create table public.sync_queue (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  entity_type   text not null check (entity_type in ('session','profile','avatar')),
  entity_id     uuid,
  operation     text not null check (operation in ('upsert','delete','upload')),
  payload       jsonb not null,
  file_path     text,
  retry_count   int default 0,
  last_error    text,
  created_at    timestamptz default now(),
  processed_at  timestamptz
);

-- Indexes
create index idx_sessions_user_id on public.sessions(user_id);
create index idx_sync_queue_user_id on public.sync_queue(user_id);
create index idx_sync_queue_pending on public.sync_queue(user_id, processed_at) where processed_at is null;

-- RLS
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.sync_queue enable row level security;

-- RLS Policies: profiles
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- RLS Policies: sessions
create policy "Users view own sessions" on public.sessions for select using (auth.uid() = user_id);
create policy "Users insert own sessions" on public.sessions for insert with check (auth.uid() = user_id);
create policy "Users update own sessions" on public.sessions for update using (auth.uid() = user_id);
create policy "Users delete own sessions" on public.sessions for delete using (auth.uid() = user_id);

-- RLS Policies: sync_queue
create policy "Users view own sync queue" on public.sync_queue for select using (auth.uid() = user_id);
create policy "Users insert own sync queue" on public.sync_queue for insert with check (auth.uid() = user_id);
create policy "Users update own sync queue" on public.sync_queue for update using (auth.uid() = user_id);

-- Feedback entries
create table public.feedbacks (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  type          text not null check (type in ('general','bug','feature')),
  email         text,
  content       text not null,
  metadata      jsonb,
  created_at    timestamptz default now()
);

create index idx_feedbacks_user_id on public.feedbacks(user_id);

alter table public.feedbacks enable row level security;

create policy "Users view own feedback" on public.feedbacks for select using (auth.uid() = user_id);
create policy "Users insert own feedback" on public.feedbacks for insert with check (auth.uid() = user_id);

-- Auto-update updated_at on profiles and sessions
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_sessions_updated_at before update on public.sessions
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
