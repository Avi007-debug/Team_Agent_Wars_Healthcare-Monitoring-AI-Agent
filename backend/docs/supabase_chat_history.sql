-- Supabase table for chat persistence used by frontend ChatPage
create extension if not exists "uuid-ossp";

create table if not exists chat_history (
  id uuid default uuid_generate_v4() primary key,
  user_id text,
  query text,
  response text,
  created_at timestamp default now()
);
