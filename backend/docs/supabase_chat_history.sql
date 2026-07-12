-- =========================
-- EXTENSIONS
-- =========================
create extension if not exists "uuid-ossp";

-- =========================
-- PROFILES TABLE
-- =========================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  created_at timestamptz default now()
);

-- =========================
-- TRIGGER
-- =========================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================
-- RLS PROFILES
-- =========================

alter table profiles enable row level security;

drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;

create policy "Users can view own profile"
on profiles
for select
to authenticated
using (id = auth.uid());

create policy "Users can insert own profile"
on profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update own profile"
on profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- =========================
-- CHAT HISTORY TABLE
-- =========================

create table if not exists chat_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  response text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_history_user_created
on chat_history (user_id, created_at desc);

-- =========================
-- RLS CHAT
-- =========================

alter table chat_history enable row level security;

drop policy if exists "Users can view own chat history" on chat_history;
drop policy if exists "Users can insert own chat history" on chat_history;
drop policy if exists "Users can delete own chat history" on chat_history;
drop policy if exists "Users can update own chat history" on chat_history;

create policy "Users can view own chat history"
on chat_history
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own chat history"
on chat_history
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can delete own chat history"
on chat_history
for delete
to authenticated
using (user_id = auth.uid());

create policy "Users can update own chat history"
on chat_history
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- =========================
-- REMINDERS TABLE
-- =========================

create table if not exists reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  medicine text not null,
  reminder_time text not null,
  status text not null default 'active',
  notification_pref text not null default 'in_app',
  frequency text not null default 'once',
  last_triggered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_reminders_user_status
on reminders (user_id, status);

-- =========================
-- RLS REMINDERS
-- =========================

alter table reminders enable row level security;

drop policy if exists "Users can view own reminders" on reminders;
drop policy if exists "Users can insert own reminders" on reminders;
drop policy if exists "Users can delete own reminders" on reminders;
drop policy if exists "Users can update own reminders" on reminders;

create policy "Users can view own reminders"
on reminders
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own reminders"
on reminders
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can delete own reminders"
on reminders
for delete
to authenticated
using (user_id = auth.uid());

create policy "Users can update own reminders"
on reminders
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- =========================================================================
-- DATABASE MIGRATIONS (Run these if the reminders table already exists)
-- =========================================================================
-- ALTER TABLE reminders ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'once';
-- ALTER TABLE reminders ADD COLUMN IF NOT EXISTS last_triggered_at timestamptz;

-- 2. Chat history multi-session partitioning & renaming:
-- ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS session_id uuid;
-- UPDATE chat_history SET session_id = '00000000-0000-0000-0000-000000000000' WHERE session_id IS NULL;
-- ALTER TABLE chat_history ALTER COLUMN session_id SET NOT NULL;
-- ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS session_name text;

-- =========================================================================
-- SUPABASE CRON SCHEDULER SETUP (pg_cron & pg_net)
-- =========================================================================
-- Enable required extensions:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the send-reminder Edge Function to run every minute:
-- SELECT cron.schedule(
--   'medassist-email-alerts',
--   '* * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://<YOUR_PROJECT_ID>.supabase.co/functions/v1/send-reminder',
--     headers := '{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb,
--     body := '{}'::jsonb
--   );
--   $$
-- );