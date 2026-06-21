create table if not exists public.site_active (
  id integer not null default 1,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint site_active_singleton check (id = 1)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.site_active'::regclass
      and conname = 'site_active_pkey'
  ) then
    alter table public.site_active add constraint site_active_pkey primary key (id);
  end if;
end $$;

insert into public.site_active (id, is_active)
values (1, true)
on conflict (id) do nothing;

alter table public.site_active enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'site_active'
      and policyname = 'Public can read site active'
  ) then
    create policy "Public can read site active" on public.site_active for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'site_active'
      and policyname = 'Super admins can manage site active'
  ) then
    create policy "Super admins can manage site active" on public.site_active for all
      using (public.current_user_role() = 'SUPER_ADMIN')
      with check (public.current_user_role() = 'SUPER_ADMIN');
  end if;
end $$;
