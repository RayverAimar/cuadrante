-- ============================================================================
-- Cuadrante — schema baseline.
-- Single-tenant. RLS gated by the allowed_emails allowlist.
-- ============================================================================

create type shift_code as enum ('M', 'T', 'N', 'V', 'L', 'D');
create type default_shift as enum ('M', 'T', 'N', 'D');
create type holiday_kind as enum ('national', 'local');

-- Allowlist: only emails in this table can read or write anything.
create table allowed_emails (
  email     text primary key,
  added_at  timestamptz not null default now()
);

insert into allowed_emails (email) values
  ('rayver@canaria.xyz'),
  ('rayver.aimar.15@gmail.com');

create or replace function is_allowed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from allowed_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create table employees (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  role              text not null default '',
  base              default_shift not null default 'M',
  avatar_color      text not null default '#888',
  vacation_balance  integer not null default 30,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table assignments (
  employee_id  uuid not null references employees(id) on delete cascade,
  day          date not null,
  shift        shift_code not null,
  note         text,
  updated_at   timestamptz not null default now(),
  primary key (employee_id, day)
);

create index assignments_day_idx on assignments (day);

-- One free-form note per calendar day, shared across the team.
create table day_notes (
  day         date primary key,
  content     text not null,
  updated_at  timestamptz not null default now()
);

create table holidays (
  day   date primary key,
  name  text not null,
  kind  holiday_kind not null default 'national'
);

create table rules (
  id       text primary key,
  enabled  boolean not null default true,
  value    integer
);

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger employees_touch    before update on employees    for each row execute function touch_updated_at();
create trigger assignments_touch  before update on assignments  for each row execute function touch_updated_at();
create trigger day_notes_touch    before update on day_notes    for each row execute function touch_updated_at();

alter table allowed_emails enable row level security;
alter table employees      enable row level security;
alter table assignments    enable row level security;
alter table day_notes      enable row level security;
alter table holidays       enable row level security;
alter table rules          enable row level security;

create policy allowed_emails_all on allowed_emails for all to authenticated using (is_allowed()) with check (is_allowed());
create policy employees_all      on employees      for all to authenticated using (is_allowed()) with check (is_allowed());
create policy assignments_all    on assignments    for all to authenticated using (is_allowed()) with check (is_allowed());
create policy day_notes_all      on day_notes      for all to authenticated using (is_allowed()) with check (is_allowed());
create policy holidays_all       on holidays       for all to authenticated using (is_allowed()) with check (is_allowed());
create policy rules_all          on rules          for all to authenticated using (is_allowed()) with check (is_allowed());
