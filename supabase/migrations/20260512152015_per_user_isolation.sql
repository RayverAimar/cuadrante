-- ============================================================================
-- Per-user isolation. Every data row gets an `owner_id` FK to `auth.users`,
-- and RLS is rewritten to scope reads/writes to `owner_id = auth.uid()`.
--
-- After this migration:
--   * Every authenticated user sees only their own cuadrante.
--   * `allowed_emails` stays as the sign-up gate (only listed emails can log
--     in), but each one gets a private workspace.
--   * Existing demo data is reassigned to rayver@canaria.xyz so the current
--     user keeps everything.
-- ============================================================================

-- 1. Add owner_id columns. Nullable for now so the backfill can run.
alter table employees   add column owner_id uuid references auth.users(id) on delete cascade;
alter table assignments add column owner_id uuid references auth.users(id) on delete cascade;
alter table holidays    add column owner_id uuid references auth.users(id) on delete cascade;
alter table rules       add column owner_id uuid references auth.users(id) on delete cascade;
alter table day_notes   add column owner_id uuid references auth.users(id) on delete cascade;
alter table change_log  add column owner_id uuid references auth.users(id) on delete cascade;

-- 2. Backfill all existing rows to rayver@canaria.xyz.
do $$
declare
  current_owner uuid;
begin
  select id into current_owner
  from auth.users
  where email = 'rayver@canaria.xyz'
  limit 1;
  if current_owner is null then
    raise exception 'rayver@canaria.xyz not found in auth.users; cannot backfill owner_id';
  end if;
  update employees    set owner_id = current_owner where owner_id is null;
  update assignments  set owner_id = current_owner where owner_id is null;
  update holidays     set owner_id = current_owner where owner_id is null;
  update rules        set owner_id = current_owner where owner_id is null;
  update day_notes    set owner_id = current_owner where owner_id is null;
  update change_log   set owner_id = current_owner where owner_id is null;
end$$;

-- 3. Now lock owner_id down: NOT NULL + default to the current authenticated
--    user so the client doesn't need to pass it on every insert.
alter table employees   alter column owner_id set not null, alter column owner_id set default auth.uid();
alter table assignments alter column owner_id set not null, alter column owner_id set default auth.uid();
alter table holidays    alter column owner_id set not null, alter column owner_id set default auth.uid();
alter table rules       alter column owner_id set not null, alter column owner_id set default auth.uid();
alter table day_notes   alter column owner_id set not null, alter column owner_id set default auth.uid();
alter table change_log  alter column owner_id set not null, alter column owner_id set default auth.uid();

-- 4. Owner indexes (every query filters by owner via RLS).
create index employees_owner_idx   on employees   (owner_id);
create index assignments_owner_idx on assignments (owner_id);
create index holidays_owner_idx    on holidays    (owner_id);
create index rules_owner_idx       on rules       (owner_id);
create index day_notes_owner_idx   on day_notes   (owner_id);
create index change_log_owner_idx  on change_log  (owner_id);

-- 5. Composite primary keys for tables whose natural key was global. Without
--    this, two users couldn't both have a holiday on the same date or their
--    own value for the same rule id.
alter table rules     drop constraint rules_pkey;
alter table rules     add primary key (id, owner_id);

alter table holidays  drop constraint holidays_pkey;
alter table holidays  add primary key (day, owner_id);

alter table day_notes drop constraint day_notes_pkey;
alter table day_notes add primary key (day, owner_id);

-- 6. Swap RLS policies. The previous `<table>_all` policies used `is_allowed()`
--    which only checked allowlist membership; now we additionally require the
--    row to belong to the current user.
drop policy if exists employees_all   on employees;
drop policy if exists assignments_all on assignments;
drop policy if exists holidays_all    on holidays;
drop policy if exists rules_all       on rules;
drop policy if exists day_notes_all   on day_notes;
drop policy if exists change_log_all  on change_log;

create policy employees_self   on employees   for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy assignments_self on assignments for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy holidays_self    on holidays    for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy rules_self       on rules       for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy day_notes_self   on day_notes   for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy change_log_self  on change_log  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
