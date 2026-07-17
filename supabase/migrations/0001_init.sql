-- Study Tracker v1 — initial schema, RLS, and progress rollup engine.
-- See study-tracker-v1-build-spec.md § Database Schema for design rationale.

-- ─────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ─────────────────────────────────────────────────────────
-- exams
-- ─────────────────────────────────────────────────────────
create table exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  target_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'planned' check (status in ('planned','active','completed','archived')),
  expected_marks numeric,
  weightage numeric not null default 1,
  completion_pct numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table exams enable row level security;
create policy "exams_select_own" on exams for select using (auth.uid() = user_id);
create policy "exams_insert_own" on exams for insert with check (auth.uid() = user_id);
create policy "exams_update_own" on exams for update using (auth.uid() = user_id);
create policy "exams_delete_own" on exams for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- subjects
-- ─────────────────────────────────────────────────────────
create table subjects (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  estimated_hours numeric,
  actual_hours numeric not null default 0,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  weightage numeric not null default 1,
  completion_pct numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table subjects enable row level security;
create policy "subjects_select_own" on subjects for select using (auth.uid() = user_id);
create policy "subjects_insert_own" on subjects for insert with check (auth.uid() = user_id);
create policy "subjects_update_own" on subjects for update using (auth.uid() = user_id);
create policy "subjects_delete_own" on subjects for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- chapters
-- ─────────────────────────────────────────────────────────
create table chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  estimated_time numeric,
  actual_time numeric not null default 0,
  weightage numeric not null default 1,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  notes text,
  completion_pct numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table chapters enable row level security;
create policy "chapters_select_own" on chapters for select using (auth.uid() = user_id);
create policy "chapters_insert_own" on chapters for insert with check (auth.uid() = user_id);
create policy "chapters_update_own" on chapters for update using (auth.uid() = user_id);
create policy "chapters_delete_own" on chapters for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- topics
-- ─────────────────────────────────────────────────────────
create table topics (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'not_started'
    check (status in ('not_started','in_progress','completed','skipped')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  estimated_time numeric,
  actual_time numeric not null default 0,
  notes text,
  is_bookmarked boolean not null default false,
  is_favorite boolean not null default false,
  revision_required boolean not null default false,
  resources jsonb not null default '{"video_links":[],"pdf_links":[],"question_links":[]}',
  weightage numeric not null default 1,
  completion_pct numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table topics enable row level security;
create policy "topics_select_own" on topics for select using (auth.uid() = user_id);
create policy "topics_insert_own" on topics for insert with check (auth.uid() = user_id);
create policy "topics_update_own" on topics for update using (auth.uid() = user_id);
create policy "topics_delete_own" on topics for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- study_sessions
-- ─────────────────────────────────────────────────────────
create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid references topics(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  is_pomodoro boolean not null default false,
  created_at timestamptz not null default now()
);

alter table study_sessions enable row level security;
create policy "sessions_select_own" on study_sessions for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on study_sessions for insert with check (auth.uid() = user_id);
create policy "sessions_update_own" on study_sessions for update using (auth.uid() = user_id);
create policy "sessions_delete_own" on study_sessions for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- tasks
-- ─────────────────────────────────────────────────────────
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'todo' check (status in ('todo','done')),
  related_exam_id uuid references exams(id) on delete set null,
  related_subject_id uuid references subjects(id) on delete set null,
  related_topic_id uuid references topics(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tasks enable row level security;
create policy "tasks_select_own" on tasks for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on tasks for update using (auth.uid() = user_id);
create policy "tasks_delete_own" on tasks for delete using (auth.uid() = user_id);

create index idx_subjects_exam_id on subjects(exam_id);
create index idx_chapters_subject_id on chapters(subject_id);
create index idx_topics_chapter_id on topics(chapter_id);
create index idx_sessions_user_started on study_sessions(user_id, started_at);
create index idx_tasks_user_due on tasks(user_id, due_date);

-- ─────────────────────────────────────────────────────────
-- Progress rollup engine (topic → chapter → subject → exam)
-- ─────────────────────────────────────────────────────────
create or replace function trg_topics_before_change() returns trigger as $$
begin
  new.completion_pct := case when new.status = 'completed' then 100 else 0 end;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger topics_before_change
before insert or update on topics
for each row execute function trg_topics_before_change();

create or replace function recalc_chapter_progress(p_chapter_id uuid) returns void as $$
begin
  update chapters c
  set completion_pct = coalesce((
    select sum(t.completion_pct * t.weightage) / nullif(sum(t.weightage), 0)
    from topics t
    where t.chapter_id = p_chapter_id and t.status <> 'skipped'
  ), 0),
  updated_at = now()
  where c.id = p_chapter_id;
end;
$$ language plpgsql;

create or replace function trg_topics_after_change() returns trigger as $$
begin
  perform recalc_chapter_progress(coalesce(new.chapter_id, old.chapter_id));
  return null;
end;
$$ language plpgsql;

create trigger topics_after_change
after insert or update or delete on topics
for each row execute function trg_topics_after_change();

create or replace function recalc_subject_progress(p_subject_id uuid) returns void as $$
begin
  update subjects s
  set completion_pct = coalesce((
    select sum(c.completion_pct * c.weightage) / nullif(sum(c.weightage), 0)
    from chapters c
    where c.subject_id = p_subject_id
  ), 0),
  updated_at = now()
  where s.id = p_subject_id;
end;
$$ language plpgsql;

create or replace function trg_chapters_after_change() returns trigger as $$
begin
  perform recalc_subject_progress(coalesce(new.subject_id, old.subject_id));
  return null;
end;
$$ language plpgsql;

create trigger chapters_after_change
after insert or update or delete on chapters
for each row execute function trg_chapters_after_change();

create or replace function recalc_exam_progress(p_exam_id uuid) returns void as $$
begin
  update exams e
  set completion_pct = coalesce((
    select sum(s.completion_pct * s.weightage) / nullif(sum(s.weightage), 0)
    from subjects s
    where s.exam_id = p_exam_id
  ), 0),
  updated_at = now()
  where e.id = p_exam_id;
end;
$$ language plpgsql;

create or replace function trg_subjects_after_change() returns trigger as $$
begin
  perform recalc_exam_progress(coalesce(new.exam_id, old.exam_id));
  return null;
end;
$$ language plpgsql;

create trigger subjects_after_change
after insert or update or delete on subjects
for each row execute function trg_subjects_after_change();

-- ─────────────────────────────────────────────────────────
-- Study streak
-- ─────────────────────────────────────────────────────────
create or replace function get_study_streak(p_user_id uuid) returns integer as $$
declare
  streak integer := 0;
  d date := current_date;
begin
  loop
    exit when not exists (
      select 1 from study_sessions
      where user_id = p_user_id
        and duration_seconds > 0
        and date(started_at) = d
    );
    streak := streak + 1;
    d := d - 1;
  end loop;
  return streak;
end;
$$ language plpgsql stable;
