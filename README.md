# Study Tracker — v1 (in progress)

Full build reference: [`docs/BUILD_SPEC.md`](./docs/BUILD_SPEC.md) — read that before extending
this codebase. It has the schema, the progress-rollup trigger design, and the milestone-by-milestone
build order this project follows.

## What's built so far

| Milestone | Status |
|---|---|
| M0 — Scaffold (Next.js, Tailwind, shadcn primitives, config) | ✅ Done |
| M1 — Supabase schema + RLS + progress-rollup triggers | ✅ Done (migration written, not yet applied — see Setup) |
| M2 — Auth (signup, login, logout, forgot/reset password, verify-email, route protection) | ✅ Done |
| M3 — Core CRUD: Exams | ✅ Done — full create/edit/delete, the reference pattern |
| M3 — Core CRUD: Subjects, Chapters, Topics | 🚧 Not started — replicate the Exams pattern (see below) |
| M4 — Progress display wired end-to-end | ✅ Done for Exams; needs Subjects/Chapters/Topics UI to be fully visible |
| M5 — Study Timer | ✅ Done — start/pause/resume/stop, localStorage recovery, session logging |
| M6 — Tasks | ✅ Done (minimal: create, toggle done, delete — no recurrence/reminders per spec) |
| M7 — Search & Filters | 🚧 Not started — Navbar has a placeholder search input |
| M8 — UI Polish | 🟡 Partial — dark/light mode, toasts, and loading skeletons exist for Dashboard/Exams/Tasks |
| M9 — QA & Deploy | 🚧 Not started |

## Setup

1. **Install dependencies** (this sandbox has no network access, so this hasn't been run yet):
   ```bash
   npm install
   ```
2. **Create a Supabase project**, then copy `.env.local.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```
3. **Run the migration** against your Supabase project — either paste
   `supabase/migrations/0001_init.sql` into the Supabase SQL Editor, or, if you have the Supabase
   CLI linked:
   ```bash
   supabase db push
   ```
4. **Regenerate types** once the project is linked (the committed `types/database.types.ts` was
   hand-written to match the migration, so this is optional but recommended before extending it):
   ```bash
   npx supabase gen types typescript --linked > types/database.types.ts
   ```
5. **Run the dev server**:
   ```bash
   npm run dev
   ```

## Continuing the build

The Exams feature (`app/(dashboard)/exams/`, `components/exams/`, `services/exams.service.ts`) is
the template — Subjects, Chapters, and Topics all follow the same four-file shape:

- `services/<entity>.service.ts` — already written for all four levels
- `lib/validations/<entity>.ts` — already written for all four levels
- `app/(dashboard)/.../actions.ts` — write `create<Entity>Action` / `update<Entity>Action` /
  `delete<Entity>Action`, mirroring `app/(dashboard)/exams/actions.ts`
- `components/<entity>/` — `<Entity>Form`, `<Entity>Dialog`, `<Entity>Card` or row, `<Entity>List`,
  mirroring `components/exams/`

Subjects nest under `/exams/[examId]`, Chapters under a subject detail page, Topics under a chapter
detail page — the `app/(dashboard)/exams/[examId]/page.tsx` stub already fetches and lists subjects;
extend it into the same list → detail pattern one level at a time.
