create table if not exists public.finance_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.finance_backups enable row level security;

create policy "Users can read own backup"
on public.finance_backups for select
using (auth.uid() = user_id);

create policy "Users can insert own backup"
on public.finance_backups for insert
with check (auth.uid() = user_id);

create policy "Users can update own backup"
on public.finance_backups for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
