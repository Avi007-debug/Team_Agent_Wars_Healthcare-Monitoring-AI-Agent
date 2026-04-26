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
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
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