-- ============================================================================
-- Change log: append-only audit trail for every roster mutation.
-- Powers the "Historial" view + future analytics. Inserts only — never edited
-- after the fact, never deleted from the app (only from SQL editor if needed).
-- ============================================================================

create table change_log (
  id          uuid primary key default gen_random_uuid(),
  user_email  text not null,
  action      text not null,
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index change_log_created_at_idx on change_log (created_at desc);

alter table change_log enable row level security;

-- Same gating as everything else: only allowlisted users see / write the log.
-- Insert-only would be nicer policy-wise, but the app needs to read its own
-- entries to render the history view.
create policy change_log_all on change_log
  for all to authenticated
  using (is_allowed())
  with check (is_allowed());
