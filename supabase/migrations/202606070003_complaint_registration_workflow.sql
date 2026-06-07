alter table public.complaints
  alter column tracking_id drop default,
  add column if not exists gps_latitude numeric(10, 7),
  add column if not exists gps_longitude numeric(10, 7);

do $$
begin
  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'S'
      and n.nspname = 'public'
      and c.relname = 'complaint_number_seq'
  ) then
    create sequence public.complaint_number_seq start with 1 increment by 1;
  end if;
end $$;

create or replace function public.generate_complaint_tracking_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  complaint_year text := to_char(coalesce(new.created_at, now()), 'YYYY');
begin
  new.tracking_id := 'TVK-CBE-' || complaint_year || '-' || lpad(nextval('public.complaint_number_seq')::text, 6, '0');

  return new;
end;
$$;

drop trigger if exists complaints_generate_tracking_id on public.complaints;
create trigger complaints_generate_tracking_id
before insert on public.complaints
for each row execute function public.generate_complaint_tracking_id();

create or replace function public.insert_initial_complaint_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.complaint_status_history (
    complaint_id,
    from_status,
    to_status,
    note,
    changed_by,
    created_at
  )
  values (
    new.id,
    null,
    new.status,
    'புகார் பதிவு செய்யப்பட்டது',
    new.created_by,
    now()
  );

  return new;
end;
$$;

drop trigger if exists complaints_insert_initial_history on public.complaints;
create trigger complaints_insert_initial_history
after insert on public.complaints
for each row execute function public.insert_initial_complaint_history();
