-- ==============================================================================
-- AI Business Assistant: Production Database Schema & RLS Policies
-- Execute this script in your Supabase SQL Editor.
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  company_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Trigger to automatically create a profile when a new user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, company_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Business User'),
    coalesce(new.raw_user_meta_data->>'company_name', 'My Enterprise')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Conversations Table (AI Chat Sessions)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null default 'New Conversation',
  model text not null default 'gpt-4o-mini',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. Messages Table (Chat Messages)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  tokens_used integer,
  created_at timestamptz default now() not null
);

-- Index for fast conversation message lookup
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_conversations_user_id on public.conversations(user_id);

-- 4. Saved Business Content (Outputs generated from AI Business Tools)
create table if not exists public.saved_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  tool_type text not null, -- 'email', 'social_caption', 'product_desc', 'brainstorm', 'summary'
  input_params jsonb not null default '{}'::jsonb,
  generated_content text not null,
  tags text[] default array[]::text[],
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_saved_content_user_id on public.saved_content(user_id);
create index if not exists idx_saved_content_tool_type on public.saved_content(tool_type);

-- 5. Automations Table (Modular workflow tasks with human-in-the-loop confirmation)
create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  task_type text not null, -- 'scheduled_summary', 'email_batch', 'content_calendar'
  description text,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'awaiting_confirmation', 'running', 'completed', 'failed')),
  requires_confirmation boolean default true,
  last_run_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_automations_user_id on public.automations(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict multi-tenant isolation: Users can only select, insert, update, delete their own data.
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.saved_content enable row level security;
alter table public.automations enable row level security;

-- Profiles Policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Conversations Policies
create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- Messages Policies
create policy "Users can view own messages"
  on public.messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own messages"
  on public.messages for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own messages"
  on public.messages for delete
  using (auth.uid() = user_id);

-- Saved Content Policies
create policy "Users can view own saved content"
  on public.saved_content for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved content"
  on public.saved_content for insert
  with check (auth.uid() = user_id);

create policy "Users can update own saved content"
  on public.saved_content for update
  using (auth.uid() = user_id);

create policy "Users can delete own saved content"
  on public.saved_content for delete
  using (auth.uid() = user_id);

-- Automations Policies
create policy "Users can view own automations"
  on public.automations for select
  using (auth.uid() = user_id);

create policy "Users can insert own automations"
  on public.automations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own automations"
  on public.automations for update
  using (auth.uid() = user_id);

create policy "Users can delete own automations"
  on public.automations for delete
  using (auth.uid() = user_id);
