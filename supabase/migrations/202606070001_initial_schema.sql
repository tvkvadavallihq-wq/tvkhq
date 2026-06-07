create extension if not exists "pgcrypto";

create type public.complaint_status as enum (
  'NEW',
  'VERIFIED',
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_GOVT',
  'RESOLVED',
  'CLOSED',
  'REJECTED'
);

create type public.user_role as enum (
  'SUPER_ADMIN',
  'WARD_SECRETARY',
  'AREA_COORDINATOR',
  'VOLUNTEER'
);

create table public.wards (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique check (number > 0),
  name_ta text not null,
  name_en text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role public.user_role not null default 'VOLUNTEER',
  ward_id uuid references public.wards(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.area_pocs (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references public.wards(id) on delete cascade,
  name text not null,
  phone text not null,
  area_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.complaint_categories (
  id uuid primary key default gen_random_uuid(),
  name_ta text not null,
  name_en text,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  tracking_id text not null unique default ('TVK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  ward_id uuid not null references public.wards(id) on delete restrict,
  category_id uuid not null references public.complaint_categories(id) on delete restrict,
  complainant_name text not null,
  complainant_phone text not null,
  complainant_email text,
  area_name text not null,
  address text not null,
  title text not null,
  description text not null,
  status public.complaint_status not null default 'NEW',
  priority integer not null default 3 check (priority between 1 and 5),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.complaint_media (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  bucket text not null default 'complaint-media',
  path text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

create table public.complaint_status_history (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  from_status public.complaint_status,
  to_status public.complaint_status not null,
  note text,
  changed_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.complaint_assignments (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  assigned_to uuid not null references public.users(id) on delete restrict,
  assigned_by uuid references public.users(id) on delete set null,
  note text,
  assigned_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.ward_contacts (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references public.wards(id) on delete cascade,
  name text not null,
  designation_ta text not null,
  phone text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title_ta text not null,
  image_path text,
  link_url text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title_ta text not null,
  body_ta text not null,
  is_active boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index complaints_tracking_id_idx on public.complaints (tracking_id);
create index complaints_status_idx on public.complaints (status);
create index complaints_ward_id_idx on public.complaints (ward_id);
create index complaints_category_id_idx on public.complaints (category_id);
create index complaint_media_complaint_id_idx on public.complaint_media (complaint_id);
create index complaint_status_history_complaint_id_idx on public.complaint_status_history (complaint_id);
create index complaint_assignments_complaint_id_idx on public.complaint_assignments (complaint_id);
create index complaint_assignments_assigned_to_idx on public.complaint_assignments (assigned_to);
create index users_role_idx on public.users (role);
create index users_ward_id_idx on public.users (ward_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger complaints_set_updated_at
before update on public.complaints
for each row execute function public.set_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid() and is_active = true;
$$;

create or replace function public.current_user_ward_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ward_id from public.users where id = auth.uid() and is_active = true;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('SUPER_ADMIN', 'WARD_SECRETARY', 'AREA_COORDINATOR', 'VOLUNTEER'), false);
$$;

create or replace function public.can_manage_ward(target_ward_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_user_role() = 'SUPER_ADMIN'
    or (
      public.current_user_role() in ('WARD_SECRETARY', 'AREA_COORDINATOR', 'VOLUNTEER')
      and public.current_user_ward_id() = target_ward_id
    ),
    false
  );
$$;

alter table public.wards enable row level security;
alter table public.users enable row level security;
alter table public.area_pocs enable row level security;
alter table public.complaint_categories enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_media enable row level security;
alter table public.complaint_status_history enable row level security;
alter table public.complaint_assignments enable row level security;
alter table public.ward_contacts enable row level security;
alter table public.banners enable row level security;
alter table public.announcements enable row level security;

create policy "Public can read active wards" on public.wards for select using (is_active = true);
create policy "Admins can manage wards" on public.wards for all using (public.current_user_role() = 'SUPER_ADMIN') with check (public.current_user_role() = 'SUPER_ADMIN');

create policy "Users can read own profile" on public.users for select using (id = auth.uid());
create policy "Admins can read users" on public.users for select using (public.is_admin());
create policy "Super admins can manage users" on public.users for all using (public.current_user_role() = 'SUPER_ADMIN') with check (public.current_user_role() = 'SUPER_ADMIN');

create policy "Public can read active area pocs" on public.area_pocs for select using (is_active = true);
create policy "Admins can manage area pocs" on public.area_pocs for all using (public.can_manage_ward(ward_id)) with check (public.can_manage_ward(ward_id));

create policy "Public can read active complaint categories" on public.complaint_categories for select using (is_active = true);
create policy "Super admins can manage complaint categories" on public.complaint_categories for all using (public.current_user_role() = 'SUPER_ADMIN') with check (public.current_user_role() = 'SUPER_ADMIN');

create policy "Anyone can submit complaints" on public.complaints for insert with check (status = 'NEW');
create policy "Submitters can track complaints" on public.complaints for select using (true);
create policy "Admins can update manageable complaints" on public.complaints for update using (public.can_manage_ward(ward_id)) with check (public.can_manage_ward(ward_id));
create policy "Super admins can delete complaints" on public.complaints for delete using (public.current_user_role() = 'SUPER_ADMIN');

create policy "Anyone can add complaint media" on public.complaint_media for insert with check (true);
create policy "Admins can read complaint media" on public.complaint_media for select using (
  exists (
    select 1 from public.complaints c
    where c.id = complaint_id and public.can_manage_ward(c.ward_id)
  )
);
create policy "Super admins can manage complaint media" on public.complaint_media for all using (public.current_user_role() = 'SUPER_ADMIN') with check (public.current_user_role() = 'SUPER_ADMIN');

create policy "Admins can read status history" on public.complaint_status_history for select using (
  exists (
    select 1 from public.complaints c
    where c.id = complaint_id and public.can_manage_ward(c.ward_id)
  )
);
create policy "Admins can add status history" on public.complaint_status_history for insert with check (
  exists (
    select 1 from public.complaints c
    where c.id = complaint_id and public.can_manage_ward(c.ward_id)
  )
);

create policy "Admins can read assignments" on public.complaint_assignments for select using (
  exists (
    select 1 from public.complaints c
    where c.id = complaint_id and public.can_manage_ward(c.ward_id)
  )
);
create policy "Ward leaders can manage assignments" on public.complaint_assignments for all using (
  public.current_user_role() in ('SUPER_ADMIN', 'WARD_SECRETARY', 'AREA_COORDINATOR')
) with check (
  public.current_user_role() in ('SUPER_ADMIN', 'WARD_SECRETARY', 'AREA_COORDINATOR')
);

create policy "Public can read ward contacts" on public.ward_contacts for select using (true);
create policy "Admins can manage ward contacts" on public.ward_contacts for all using (public.can_manage_ward(ward_id)) with check (public.can_manage_ward(ward_id));

create policy "Public can read active banners" on public.banners for select using (
  is_active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);
create policy "Super admins can manage banners" on public.banners for all using (public.current_user_role() = 'SUPER_ADMIN') with check (public.current_user_role() = 'SUPER_ADMIN');

create policy "Public can read active announcements" on public.announcements for select using (
  is_active = true
  and (published_at is null or published_at <= now())
);
create policy "Super admins can manage announcements" on public.announcements for all using (public.current_user_role() = 'SUPER_ADMIN') with check (public.current_user_role() = 'SUPER_ADMIN');
