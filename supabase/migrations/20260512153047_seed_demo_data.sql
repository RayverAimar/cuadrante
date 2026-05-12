-- ============================================================================
-- Demo dataset for rayver@canaria.xyz.
--
-- Inserts 14 employees with realistic Spanish names spread across six roles,
-- a full month of shift assignments using a rotating 5-on / 2-off pattern,
-- two vacation blocks, one medical-license block, seven cell notes, two
-- company-local holidays, and four day notes.
--
-- Owner-scoped: all rows belong to the rayver@canaria.xyz user_id so the
-- per-user RLS keeps them private. Idempotent: re-running wipes the prior
-- all-zero-UUID employees + the user's local holidays / day notes and then
-- rebuilds from scratch. Empty user-created employees (no assignments and
-- not in the seed) are also cleared so demo screenshots stay tidy.
-- ============================================================================

do $$
declare
  current_owner uuid;
  month_start   date;
  month_end     date;
  emp           record;
  d             date;
  offset_       int;
  pattern_pos   int;
  shift_val     shift_code;
begin
  select id into current_owner from auth.users where email = 'rayver@canaria.xyz' limit 1;
  if current_owner is null then
    raise exception 'rayver@canaria.xyz not found in auth.users';
  end if;

  -- Wipe seed-owned rows + any orphan empty employees the demo user created.
  delete from assignments where employee_id::text like '00000000-%';
  delete from employees   where id::text          like '00000000-%';
  delete from employees
   where owner_id = current_owner
     and id::text not like '00000000-%'
     and not exists (select 1 from assignments where employee_id = employees.id);
  delete from holidays  where owner_id = current_owner and kind = 'local';
  delete from day_notes where owner_id = current_owner;

  month_start := date_trunc('month', current_date)::date;
  month_end   := (date_trunc('month', current_date) + interval '1 month - 1 day')::date;

  -- Employees: balanced across morning (M), afternoon (T) and night (N) shifts.
  insert into employees (id, name, role, base, avatar_color, vacation_balance, owner_id) values
    ('00000000-0000-0000-0000-000000000001', 'Ana García',         'Recepción',      'M', '#f59e0b', 22, current_owner),
    ('00000000-0000-0000-0000-000000000002', 'Carlos López',       'Recepción',      'T', '#3b82f6', 15, current_owner),
    ('00000000-0000-0000-0000-000000000003', 'María Rodríguez',    'Recepción',      'M', '#10b981',  8, current_owner),
    ('00000000-0000-0000-0000-000000000004', 'Lucía Fernández',    'Recepción',      'N', '#a855f7', 30, current_owner),
    ('00000000-0000-0000-0000-000000000005', 'Pedro Martínez',     'Seguridad',      'N', '#8b5cf6', 30, current_owner),
    ('00000000-0000-0000-0000-000000000006', 'Diego Torres',       'Seguridad',      'N', '#06b6d4', 26, current_owner),
    ('00000000-0000-0000-0000-000000000007', 'Javier Castro',      'Seguridad',      'T', '#0ea5e9', 19, current_owner),
    ('00000000-0000-0000-0000-000000000008', 'Laura Sánchez',      'Cocina',         'T', '#ec4899', 18, current_owner),
    ('00000000-0000-0000-0000-000000000009', 'Mateo Ruiz',         'Cocina',         'M', '#f43f5e', 24, current_owner),
    ('00000000-0000-0000-0000-00000000000a', 'Valentina Núñez',    'Cocina',         'T', '#fb923c', 12, current_owner),
    ('00000000-0000-0000-0000-00000000000b', 'Andrés Vargas',      'Caja',           'M', '#84cc16', 27, current_owner),
    ('00000000-0000-0000-0000-00000000000c', 'Camila Herrera',     'Caja',           'T', '#22c55e', 21, current_owner),
    ('00000000-0000-0000-0000-00000000000d', 'Sofía Ramírez',      'Administración', 'M', '#ef4444', 30, current_owner),
    ('00000000-0000-0000-0000-00000000000e', 'Bruno Salazar',      'Mantenimiento',  'M', '#64748b', 28, current_owner);

  -- Rotating shift pattern: 5 base + 2 D, with a per-employee offset so the
  -- days-off don't all pile on the same weekday.
  offset_ := 0;
  for emp in
    select id, base from employees
    where id::text like '00000000-%'
    order by id
  loop
    d := month_start;
    while d <= month_end loop
      pattern_pos := (extract(day from d)::int + offset_) % 7;
      if pattern_pos in (5, 6) then
        shift_val := 'D'::shift_code;
      else
        shift_val := emp.base::text::shift_code;
      end if;
      insert into assignments (employee_id, day, shift, owner_id) values (emp.id, d, shift_val, current_owner);
      d := d + 1;
    end loop;
    offset_ := offset_ + 1;
  end loop;

  -- Vacation blocks (María mid-month, Andrés long weekend) + medical license
  -- for Laura — exercise the V and L shift codes in the grid.
  update assignments
     set shift = 'V'::shift_code
   where employee_id = '00000000-0000-0000-0000-000000000003'
     and day between (month_start + interval '10 days')::date and (month_start + interval '16 days')::date;

  update assignments
     set shift = 'V'::shift_code
   where employee_id = '00000000-0000-0000-0000-00000000000b'
     and day between (month_start + interval '2 days')::date and (month_start + interval '5 days')::date;

  update assignments
     set shift = 'L'::shift_code
   where employee_id = '00000000-0000-0000-0000-000000000008'
     and day between (month_start + interval '7 days')::date and (month_start + interval '9 days')::date;

  -- Cell notes — these attach to specific (employee, day) assignments so the
  -- red triangle marker shows up in the grid.
  update assignments set note = 'Cubre turno de María (vacaciones)'
    where employee_id = '00000000-0000-0000-0000-000000000001' and day = (month_start + interval '11 days')::date;
  update assignments set note = 'Llega 30 min tarde (cita médica)'
    where employee_id = '00000000-0000-0000-0000-000000000002' and day = (month_start + interval '4 days')::date;
  update assignments set note = 'Inicio de descanso médico — DM #2025-381'
    where employee_id = '00000000-0000-0000-0000-000000000008' and day = (month_start + interval '7 days')::date;
  update assignments set note = 'Capacitación contra-incendios 14h-17h'
    where employee_id = '00000000-0000-0000-0000-000000000005' and day = (month_start + interval '14 days')::date;
  update assignments set note = 'Inventario mensual — quedarse hasta cerrar'
    where employee_id = '00000000-0000-0000-0000-00000000000c' and day = (month_start + interval '29 days')::date;
  update assignments set note = 'Reemplaza a Pedro (cumpleaños familiar)'
    where employee_id = '00000000-0000-0000-0000-000000000006' and day = (month_start + interval '20 days')::date;
  update assignments set note = 'Recibe nuevo proveedor de carnes 7am'
    where employee_id = '00000000-0000-0000-0000-000000000009' and day = (month_start + interval '17 days')::date;

  -- Company-local holidays (beyond the Peruvian national ones, which are
  -- hard-coded in the frontend).
  insert into holidays (day, name, kind, owner_id) values
    ((month_start + interval '14 days')::date, 'Aniversario de la empresa',  'local', current_owner),
    ((month_start + interval '21 days')::date, 'Día del trabajador interno', 'local', current_owner)
  on conflict (day, owner_id) do update set name = excluded.name;

  -- Day notes (one note per calendar day, shared across the team).
  insert into day_notes (day, content, owner_id) values
    ((month_start + interval '1 days')::date,  'Visita de auditoría externa — Tener uniformes en orden.',                                 current_owner),
    ((month_start + interval '8 days')::date,  'Reunión de coordinación 9am en sala 2. Asisten jefes de área.',                           current_owner),
    ((month_start + interval '14 days')::date, 'Aniversario empresa — almuerzo a las 13h en patio interior. Asistencia opcional.',        current_owner),
    ((month_start + interval '23 days')::date, 'Cierre contable del mes. Caja debe quedar cuadrada antes de las 18h.',                    current_owner)
  on conflict (day, owner_id) do update set content = excluded.content;
end$$;
