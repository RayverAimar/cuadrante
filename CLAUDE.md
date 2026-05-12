# CLAUDE.md

Guide for Claude (and any collaborator) when working on this repo.

## What this is

Cuadrante: internal tool for planning monthly shift rosters for a company's staff. **Product for a single user / a small group of admins**, not a public SaaS. Sensitive data (shifts, leaves) protected by auth + allowlist + per-user RLS.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React 18 + TypeScript |
| State | Zustand (no `persist` — Supabase is the source of truth) |
| Backend | **No in-house backend**. The frontend talks directly to Supabase. |
| DB | Supabase Postgres (project `cuadrante`, ref `euzdrkasakiazplrmuqy`, region São Paulo) |
| Auth | Supabase Auth with Google OAuth |
| Authorization | Row Level Security gated by `auth.uid()` + `allowed_emails` sign-up gate |
| Deploy | GitHub Pages (base path `/cuadrante/`) via GitHub Actions |

## Running locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/cuadrante/` (note the subpath — it matches GitHub Pages).

Requires `.env.local` at the root:

```
VITE_SUPABASE_URL=https://euzdrkasakiazplrmuqy.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

The anon key is public (it ships in the client bundle) — it's protected by RLS, not by secrecy.

## Key structure

```
src/
├── App.tsx                        # auth gate + initial data load
├── lib/
│   ├── supabase.ts                # Supabase client
│   ├── supabase-types.ts          # generated types (do not edit by hand)
│   └── useAuth.ts                 # session hook + signIn/signOut
├── store/
│   ├── useRosterStore.ts          # Zustand store; load + optimistic mutators + change_log
│   └── useToastStore.ts           # error toasts
├── components/
│   ├── Login.tsx                  # sign-in screen (gated in App.tsx)
│   ├── Cuadrante.tsx              # main view
│   ├── cuadrante/                 # internal pieces of the main view
│   │   ├── TopBar.tsx             # header (logo, undo/redo/history, month, actions)
│   │   ├── FilterBar.tsx          # search + role filter
│   │   ├── RosterGrid.tsx         # monthly table (sticky head/cov, scrollable)
│   │   ├── SidePanel.tsx          # right drawer with validation + coverage stats
│   │   ├── SelectionActionBar.tsx # floating bar when cells are selected
│   │   └── print/                 # print-only components (portaled to <body>)
│   ├── modals/                    # Employees, Rules, Help, History, Note, …
│   └── ui/                        # primitives (Modal, Tooltip, Select, Toasts, Icon, …)
├── rules/index.ts                 # rules engine + defaults
├── types/index.ts                 # domain types
├── constants/shifts.ts            # M/T/N/V/L/D definitions, labels, colors
├── utils/                         # date, autoFill, copyMonth, export, print
└── data/holidays.ts               # Peruvian national holidays

supabase/
└── migrations/                    # versioned SQL
```

## DB migrations

**Golden rule:** never edit a migration that has already been applied. Create a new one.

```bash
# 1. create empty .sql file with timestamp
supabase migration new <descriptive_name>

# 2. edit supabase/migrations/<timestamp>_<name>.sql with the SQL

# 3. apply to remote
supabase db push

# 4. regenerate TS types (if the schema changed)
supabase gen types typescript --linked 2>/dev/null \
  | grep -v "^Initialising\|^$" > src/lib/supabase-types.ts
```

Migrations are committed to git. The `gen types` command emits noise to stderr ("Initialising login role…") — that's what the filter is for.

## Allowlist (who can sign in)

Every authorized email lives in the `allowed_emails` table. To add or remove:

```bash
supabase migration new add_user_<name>
```

```sql
-- add
insert into allowed_emails (email) values ('someone@company.com')
on conflict (email) do nothing;

-- remove
delete from allowed_emails where email = 'ex-employee@company.com';
```

Quick alternative without a migration (not recommended — doesn't end up in git): dashboard SQL editor.

## RLS — policy for new tables

Every new tenant-scoped table MUST:

1. Carry an `owner_id uuid` column with FK `references auth.users(id) on delete cascade` and `default auth.uid()`.
2. Enable RLS.
3. Have a policy that scopes both reads and writes to the current user.

Pattern:

```sql
create table my_table (
  id        uuid primary key default gen_random_uuid(),
  -- ...other columns...
  owner_id  uuid not null default auth.uid() references auth.users(id) on delete cascade
);
create index my_table_owner_idx on my_table (owner_id);

alter table my_table enable row level security;

create policy my_table_self on my_table
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
```

For tables whose natural key was previously global (think `holidays.day`, `day_notes.day`, `rules.id`), make the PK composite with `owner_id` so two users can hold the same key.

## Store conventions (`useRosterStore`)

- **Initial load:** `loadAll()` is called from `App.tsx` after authenticating. It pulls employees, assignments, local holidays, rules, and day notes in parallel. The UI waits with a loader.
- **Mutators are sync on the outside, async on the inside:** local optimistic update + background Supabase write. Action signatures (`setCell`, `addEmployee`, …) didn't change vs. the old localStorage version.
- **Errors:** errors are logged to `console.error` AND pushed as a toast via `useToastStore`. No automatic rollback yet — when a Supabase write fails, the local state stays diverged until reload.
- **Cell notes** live in `assignments.note`; in the store they're at `notesByMonth[k][empId][day]`. A cell note requires the cell to have a shift assigned (because the PK of `assignments` is `(employee_id, day)` and `shift` is `NOT NULL`).
- **Day notes** live in `day_notes (day, content, owner_id)`. In the store they're at `dayNotes['<y>-<m>-<d>']`. Independent of assignments — apply to the calendar day, not to any one employee.
- **Undo/Redo:** session-scoped stacks (`undoStack`, `redoStack`) of `UndoEntry { year, month, assignments, notes }`. Any new mutation clears the redo stack. Triggered by `⌘Z` / `⌘⇧Z` (or `Ctrl+Z`/`Ctrl+Shift+Z`) plus the buttons in `TopBar`.
- **Change log:** every mutator calls `logChange(action, detail)` which inserts a row into the `change_log` table. The audit trail is persistent and rendered by `HistoryModal`.

## Auth

- Provider: Google OAuth. Configured in the Supabase dashboard and in Google Cloud Console.
- Registered redirect URIs: `https://<project>.supabase.co/auth/v1/callback`, `http://localhost:5173`, `http://localhost:5173/cuadrante/`.
- Supabase Auth "Site URL" + "Additional Redirect URLs": `http://localhost:5173/cuadrante/**` and the production URL.
- The signed-in user's email is checked against `allowed_emails`. If it's not there, `useAuth` returns `allowed: false` and the "access denied" screen renders.

## Deployment

GitHub Pages with `base: '/cuadrante/'` configured in `vite.config.ts`. Workflow lives at `.github/workflows/deploy.yml`:

1. On every push to `master`, GitHub Actions runs `npm run build`.
2. Env vars come from repo secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. The built `dist/` is published via the official `actions/upload-pages-artifact` + `actions/deploy-pages` actions.

Any new domain must also be added to:

- Google Cloud Console → OAuth Credentials → Authorized redirect URIs
- Supabase Dashboard → Authentication → URL Configuration → Redirect URLs

## Styling / UI

- Typography: `var(--serif)` for hero text, `var(--sans)` for body, `var(--mono)` for labels and data. Uppercase + wide tracking for "eyebrows".
- Shift colors: `var(--<CODE>-bg)` and `var(--<CODE>-fg)`. Brand accent: `var(--accent)`.
- 32×32 grid background on landing-style screens (`Login.tsx`).
- Modals: use `components/ui/Modal.tsx`. `NoteModal` and `HistoryModal` are good usage examples.
- Native `<select>` is banned across the app — use `components/ui/Select.tsx` so the dropdown styling stays consistent.

## Open items / pending decisions

- **Vitest tests for `autoFill.ts`:** determinism, respect for pre-assigned cells, hard-rule enforcement (post-night rest, ≤6 days in a row).
- **Realtime sync** (Supabase channels) — doesn't apply with the current per-user model, but would matter if we ever go multi-org.
- **Compact grid view** for rosters with >30 employees.
- **Rollback on Supabase write failure** — today the local state stays optimistic even when the backend rejects. The toast surfaces it, but the data drifts until reload.
- **Replace `is_allowed()` SQL function** — it's still defined and granted but no policy references it after `20260512152015_per_user_isolation.sql`. Kept for clarity (`allowed_emails` remains the sign-up gate) but worth a comment in the schema, or drop it.
