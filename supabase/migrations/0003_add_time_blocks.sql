-- ─────────────────────────────────────────────────────────
-- time_blocks
-- ─────────────────────────────────────────────────────────
create table time_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  activity text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_time_range check (start_time < end_time)
);

alter table time_blocks enable row level security;
create policy "time_blocks_select_own" on time_blocks for select using (auth.uid() = user_id);
create policy "time_blocks_insert_own" on time_blocks for insert with check (auth.uid() = user_id);
create policy "time_blocks_update_own" on time_blocks for update using (auth.uid() = user_id);
create policy "time_blocks_delete_own" on time_blocks for delete using (auth.uid() = user_id);

create index idx_time_blocks_user_day on time_blocks(user_id, day_of_week);
