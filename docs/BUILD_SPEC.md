# Study Tracker & Exam Management System — V1 Build Spec

## How to use this document

This is the build reference for **v1** — a scoped-down, shippable subset of the full
README vision. It exists so an agent (or a human) picking this up cold can build
without re-deriving decisions that were already made. Rules for using it:

1. Follow the milestones in **Build Order** sequentially — each depends on the last.
2. Before making a design decision not covered here, check the **Decisions Log** first —
   it resolves the ambiguities in the original README.
3. Anything in **Out of Scope (V2 Backlog)** should not be built now, even if it's easy —
   scope creep here is the main risk to shipping v1.
4. The SQL in **Database Schema** is meant to be run more or less as-is, as a Supabase
   migration. Adjust naming only if it conflicts with generated types.

---

## Tech Stack (locked)

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, Server Components + Server Actions) |
| Language | TypeScript (strict mode) |
| DB & Auth | Supabase (Postgres + Supabase Auth + RLS) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide React |
| Toasts | sonner (via shadcn) |
| Deployment | Vercel |

Not needed for v1 (install later): PapaParse (CSV import is v2).

---

## V1 Scope

### In Scope
- Auth: signup, email verification, login, logout, forgot/reset password
- Core hierarchy CRUD: Exams → Subjects → Chapters → Topics
- Automatic weighted progress rollup (Topic → Chapter → Subject → Exam)
- Dashboard: overall progress, upcoming exams, weekly study hours, completion %,
  pending topics, study streak, today's tasks
- Study Timer: start / pause / resume / stop, session logging
- Tasks (minimal): title, description, due date, priority, linked exam/subject/topic
- Global search + basic filters (exam, subject, status, priority)
- Responsive UI shell: sidebar, navbar, cards, progress bars, list/grid view,
  dark/light mode, toast notifications, loading skeletons
- RLS on every table
- Basic CI: lint + typecheck on PR; unit tests for the progress rollup logic

### Out of Scope (V2 Backlog)
- CSV Import (upload, mapping, dedup, rollback)
- Bulk Operations (bulk complete/delete/move/assign)
- Revision Scheduler (spaced-repetition intervals, revision calendar, overdue tracking)
- Calendar view
- Mock Tests + score trends
- Notes (Markdown editor with autosave)
- Advanced Analytics (weak/strong subjects, revision success rate)
- Command Palette
- Kanban board view
- Recurring tasks + reminder delivery (email/push)
- File uploads (Supabase Storage) — v1 links are external URLs only
- Data export / backup
- PWA / offline support
- E2E test suite (Playwright)

---

## Decisions Log

Resolves ambiguities in the original README so the agent doesn't need to re-derive them:

- **Subtopics are folded into Topics.** The README's hierarchy diagram included a
  Subtopics level that the table list never defined. V1 uses one leaf level (Topics)
  to avoid an unnecessary 5th hierarchy tier.
- **Topic `completion_pct` is derived from `status`**, not a separately editable
  "Progress" field. `status = 'completed'` → 100, everything else → 0. This removes
  the checkbox/progress/status three-way ambiguity in the original spec.
- **Skipped topics are excluded from parent rollups** (not counted as 0 or 100).
- **Every level (subject, chapter, topic) has a `weightage` column**, defaulting to 1.
  Rollup is a weighted average, not a plain average, so a 3-mark chapter doesn't
  count the same as a 30-mark one.
- **Reminders are out of scope for v1.** The Task `Reminder` field from the README
  needs a delivery mechanism (email/push) that isn't built yet — v1 tasks are
  informational only.
- **Revision fields exist but do nothing yet.** `topics.revision_required` is a plain
  boolean flag for v2 to build on; there's no scheduler or interval logic in v1.
- **Study Timer pause/resume math happens client-side.** Only a single row is written
  to `study_sessions` per completed session (on Stop), with `duration_seconds`
  accumulated in the client. Timer state is persisted to `localStorage` every ~10s
  so a refresh mid-session doesn't lose progress.
- **PDF/video/question links are external URLs**, stored as JSONB on `topics`, not
  file uploads.

---

## Database Schema

Run as a Supabase migration (`supabase/migrations/0001_init.sql`).

```sql
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

-- auto-create a profile row when a user signs up
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

-- indexes for common lookups
create index idx_subjects_exam_id on subjects(exam_id);
create index idx_chapters_subject_id on chapters(subject_id);
create index idx_topics_chapter_id on topics(chapter_id);
create index idx_sessions_user_started on study_sessions(user_id, started_at);
create index idx_tasks_user_due on tasks(user_id, due_date);
```

### Progress rollup engine

```sql
-- topic completion_pct is derived from status, before every insert/update
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

-- recompute a chapter's completion_pct from its topics (weighted avg, skips excluded)
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

-- recompute a subject's completion_pct from its chapters
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

-- recompute an exam's completion_pct from its subjects
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
```

**How the cascade works:** a topic status change fires `topics_after_change`, which
recalculates the parent chapter. That `update` on `chapters` fires
`chapters_after_change`, which recalculates the parent subject. That fires
`subjects_after_change`, which recalculates the parent exam. Four levels, one
direction, no loops — terminates at `exams` because it has no further trigger.

### Study streak

```sql
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
```

---

## Project Structure

```
app/
  (auth)/
    login/page.tsx
    signup/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
    verify-email/page.tsx
  (dashboard)/
    layout.tsx                          # sidebar + navbar shell, auth-guarded
    dashboard/page.tsx
    exams/page.tsx
    exams/[examId]/page.tsx
    exams/[examId]/subjects/[subjectId]/page.tsx
    exams/[examId]/subjects/[subjectId]/chapters/[chapterId]/page.tsx
    tasks/page.tsx
    timer/page.tsx
  layout.tsx
  page.tsx                              # redirects to /dashboard or /login
  middleware.ts                         # Supabase session check, route protection

components/
  ui/                                   # shadcn-generated primitives
  layout/                               # Sidebar, Navbar, ThemeToggle
  exams/                                # ExamCard, ExamForm, ExamList
  subjects/
  chapters/
  topics/                               # TopicRow, TopicForm, StatusBadge
  tasks/                                # TaskList, TaskForm
  timer/                                # StudyTimer, TimerControls
  dashboard/                            # StatsCard, ProgressChart, UpcomingExams
  shared/                               # EmptyState, LoadingSkeleton, ConfirmDialog, SearchBar

hooks/
  use-exams.ts, use-subjects.ts, use-chapters.ts, use-topics.ts
  use-tasks.ts, use-timer.ts, use-debounce.ts

lib/
  supabase/client.ts                    # browser client
  supabase/server.ts                    # server client (Server Components/Actions)
  supabase/middleware.ts
  validations/                          # zod schemas: exam.ts, subject.ts, chapter.ts, topic.ts, task.ts
  utils.ts

services/
  exams.service.ts
  subjects.service.ts
  chapters.service.ts
  topics.service.ts
  tasks.service.ts
  sessions.service.ts

supabase/
  migrations/0001_init.sql

types/
  database.types.ts                     # generated: supabase gen types typescript
  domain.ts                             # app-level derived types
```

---

## Feature Specs

### Auth
Supabase Auth with email/password. Pages: signup, login, forgot-password,
reset-password, verify-email (handles the confirmation link redirect). Middleware
protects everything under `(dashboard)`; redirects unauthenticated users to `/login`
and authenticated users away from `/login` and `/signup`.

### Exam / Subject / Chapter / Topic CRUD
Nested list → detail pattern: Exams list → Exam detail (shows Subjects) → Subject
detail (shows Chapters) → Chapter detail (shows Topics). Each level: create, edit,
delete (with confirm dialog), and a progress bar driven by `completion_pct`. Topic
rows get a status dropdown (not_started / in_progress / completed / skipped),
bookmark/favorite toggle icons, and a resources popover for the three link arrays.

### Dashboard
Cards for: overall progress (avg of active exams), upcoming exams (soonest
`target_date` first), weekly study hours (sum of `study_sessions.duration_seconds`
for last 7 days), completion %, pending topics count (`status != 'completed'`),
study streak (`get_study_streak`), and today's tasks (`due_date = today`,
`status = 'todo'`). One Recharts bar chart for daily study hours, last 7 days.

### Study Timer
Client-side timer with Start/Pause/Resume/Stop. State (elapsed seconds, running
topic_id, is_pomodoro flag) is written to `localStorage` every ~10s so a refresh
doesn't lose an in-progress session. On Stop, write one row to `study_sessions`
with `started_at`, `ended_at`, `duration_seconds`. Pomodoro mode is just a preset
25-min countdown that auto-stops and logs the session — no separate scheduling logic.

### Tasks
Simple list with create/edit/delete, due date, priority, optional links to an exam,
subject, or topic. Checkbox to mark done (`status = 'done'`). No recurrence, no
reminder delivery in v1.

### Search & Filters
One global search input (debounced) querying name/title across exams, subjects,
chapters, topics, and tasks — `ilike` match, grouped results by entity type. Each
list view (Exams, Subjects, Chapters, Topics, Tasks) additionally supports filtering
by status and priority via dropdowns; Topics/Chapters lists also filter by parent
exam/subject.

### UI Shell
Sidebar (Dashboard, Exams, Tasks, Timer, Settings), top navbar with search + theme
toggle + user menu. Dark/light mode via a simple class-based Tailwind toggle stored
in a cookie (not localStorage, so it works with SSR). Loading skeletons for every
list/detail view. Toasts (sonner) for create/update/delete confirmations and errors.

---

## Build Order

Each milestone should be completed and manually verified before starting the next.

**M0 — Scaffold**
Next.js 15 + TS + Tailwind + shadcn init. ESLint + Prettier configured. `.env.local`
with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (server-only). Supabase project created and linked.
*Done when:* `npm run dev` renders a blank shell with Tailwind working.

**M1 — Schema**
Run `0001_init.sql` as a migration. Generate types (`supabase gen types typescript`).
*Done when:* all tables exist, RLS is enabled, and a manual insert as one test user
is invisible to a second test user.

**M2 — Auth**
Signup, email verification, login, logout, forgot/reset password, route-protection
middleware.
*Done when:* an unauthenticated user is redirected from `/dashboard` to `/login`,
and a full signup → verify → login → logout loop works.

**M3 — Core CRUD**
Exams, then Subjects, then Chapters, then Topics — in that order, since each nests
inside the last. Forms via RHF + Zod, matching the DB constraints.
*Done when:* a user can create a full Exam → Subject → Chapter → Topic chain and
see it reflected in list and detail views.

**M4 — Progress**
Wire `completion_pct` into progress bars at all four levels and confirm the trigger
cascade works end-to-end (toggle a topic to `completed`, verify chapter/subject/exam
percentages update on refresh).
*Done when:* changing one topic's status visibly changes its exam's completion %.

**M5 — Study Timer**
Start/Pause/Resume/Stop UI, `localStorage` persistence, session write on Stop, and
Dashboard's weekly-hours + streak cards wired to real data.
*Done when:* a completed session shows up in the weekly chart and updates the streak.

**M6 — Tasks**
CRUD list, linking to exam/subject/topic, "today's tasks" on Dashboard.
*Done when:* a task due today appears on the Dashboard and disappears when marked done.

**M7 — Search & Filters**
Global search bar, per-list filter controls.
*Done when:* searching a topic name surfaces it with its parent chain shown, and
filtering a Topics list by status/priority works.

**M8 — UI Polish**
Dark/light mode, toasts, loading skeletons, responsive pass on mobile widths.
*Done when:* every list/detail view has a loading state and no layout breaks below 375px.

**M9 — QA & Deploy**
Unit tests for the progress-rollup math (can be tested via pgTAP against the SQL
functions, or by replicating the weighted-average logic in a plain TS function and
unit-testing that). CI running lint + typecheck on PR. Deploy to Vercel.
*Done when:* CI is green and the deployed app supports a full signup-to-dashboard flow.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server-only, never exposed to client
```
