alter table public.users
  drop constraint if exists users_id_fkey;

alter table public.users
  alter column id set default gen_random_uuid();

alter table public.users
  add column if not exists username text;

alter table public.users
  add column if not exists password_hash text;

create index if not exists users_username_idx on public.users (username);
