create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references public.wards(id) on delete cascade,
  name text not null,
  pincode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists areas_ward_id_idx on public.areas (ward_id);
create index if not exists areas_name_idx on public.areas (name);

alter table public.areas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'areas'
      and policyname = 'Public can read areas'
  ) then
    create policy "Public can read areas" on public.areas for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'areas'
      and policyname = 'Super admins can manage areas'
  ) then
    create policy "Super admins can manage areas" on public.areas for all
      using (public.current_user_role() = 'SUPER_ADMIN')
      with check (public.current_user_role() = 'SUPER_ADMIN');
  end if;
end $$;
