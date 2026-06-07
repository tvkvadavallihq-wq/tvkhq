alter table public.complaint_status_history
  add column if not exists from_status complaint_status,
  add column if not exists to_status complaint_status,
  add column if not exists activity_type text not null default 'STATUS_CHANGE',
  add column if not exists created_by uuid;

alter table public.complaint_assignments
  add column if not exists assigned_by_role user_role,
  add column if not exists assigned_to_role user_role,
  add column if not exists remarks text,
  add column if not exists created_by uuid;

alter table public.complaint_media
  add column if not exists bucket text not null default 'complaint-media',
  add column if not exists storage_path text,
  add column if not exists media_stage text not null default 'BEFORE',
  add column if not exists caption text;

create or replace function public.admin_next_assignment_role(actor_role user_role)
returns user_role
language sql
immutable
set search_path = public
as $$
  select case actor_role
    when 'SUPER_ADMIN' then 'WARD_SECRETARY'::user_role
    when 'WARD_SECRETARY' then 'AREA_COORDINATOR'::user_role
    when 'AREA_COORDINATOR' then 'VOLUNTEER'::user_role
    else null
  end;
$$;

create or replace function public.admin_validate_status_transition(actor_role user_role, from_status complaint_status, to_status complaint_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if actor_role = 'SUPER_ADMIN' then
    return;
  end if;

  if from_status = to_status then
    raise exception 'Status is unchanged.';
  end if;

  case actor_role
    when 'WARD_SECRETARY' then
      if not (
        (from_status = 'NEW' and to_status = 'VERIFIED')
        or (from_status = 'VERIFIED' and to_status = 'ASSIGNED')
        or (from_status = 'ASSIGNED' and to_status = 'IN_PROGRESS')
        or (from_status = 'IN_PROGRESS' and to_status in ('WAITING_GOVT', 'RESOLVED'))
        or (from_status = 'WAITING_GOVT' and to_status in ('IN_PROGRESS', 'RESOLVED'))
        or (from_status = 'RESOLVED' and to_status = 'CLOSED')
      ) then
        raise exception 'Role not allowed to move complaint from % to %.', from_status, to_status;
      end if;
    when 'AREA_COORDINATOR' then
      if not (
        (from_status = 'ASSIGNED' and to_status = 'IN_PROGRESS')
        or (from_status = 'IN_PROGRESS' and to_status in ('WAITING_GOVT', 'RESOLVED'))
        or (from_status = 'WAITING_GOVT' and to_status in ('IN_PROGRESS', 'RESOLVED'))
      ) then
        raise exception 'Role not allowed to move complaint from % to %.', from_status, to_status;
      end if;
    when 'VOLUNTEER' then
      if not (
        (from_status = 'ASSIGNED' and to_status = 'IN_PROGRESS')
        or (from_status = 'IN_PROGRESS' and to_status = 'RESOLVED')
      ) then
        raise exception 'Role not allowed to move complaint from % to %.', from_status, to_status;
      end if;
    else
      raise exception 'Role not allowed to manage complaint status.';
  end case;
end;
$$;

create or replace function public.admin_record_complaint_status_change(
  p_complaint_id uuid,
  p_to_status complaint_status,
  p_changed_by uuid,
  p_remarks text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_status complaint_status;
  v_actor_role user_role;
begin
  select current_status into v_from_status
  from public.complaints
  where id = p_complaint_id
  for update;

  if v_from_status is null then
    raise exception 'Complaint not found.';
  end if;

  select role into v_actor_role
  from public.users
  where id = p_changed_by
  and is_active = true;

  if v_actor_role is null then
    raise exception 'Acting user not found or inactive.';
  end if;

  perform public.admin_validate_status_transition(v_actor_role, v_from_status, p_to_status);

  update public.complaints
  set current_status = p_to_status,
      updated_at = now(),
      resolved_at = case
        when p_to_status in ('RESOLVED', 'CLOSED') then coalesce(resolved_at, now())
        else null
      end
  where id = p_complaint_id;

  insert into public.complaint_status_history (
    complaint_id,
    from_status,
    to_status,
    activity_type,
    remarks,
    created_by,
    changed_by,
    created_at
  )
  values (
    p_complaint_id,
    v_from_status,
    p_to_status,
    'STATUS_CHANGE',
    p_remarks,
    p_changed_by,
    p_changed_by,
    now()
  );
end;
$$;

create or replace function public.admin_record_complaint_comment(
  p_complaint_id uuid,
  p_changed_by uuid,
  p_remarks text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status complaint_status;
begin
  select current_status into v_status
  from public.complaints
  where id = p_complaint_id
  for update;

  if v_status is null then
    raise exception 'Complaint not found.';
  end if;

  insert into public.complaint_status_history (
    complaint_id,
    from_status,
    to_status,
    activity_type,
    remarks,
    created_by,
    changed_by,
    created_at
  )
  values (
    p_complaint_id,
    v_status,
    v_status,
    'COMMENT',
    p_remarks,
    p_changed_by,
    p_changed_by,
    now()
  );
end;
$$;

create or replace function public.admin_record_complaint_assignment(
  p_complaint_id uuid,
  p_assigned_to uuid,
  p_assigned_by uuid,
  p_remarks text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_status complaint_status;
  v_actor_role user_role;
  v_target_role user_role;
  v_expected_role user_role;
begin
  select current_status into v_current_status
  from public.complaints
  where id = p_complaint_id
  for update;

  if v_current_status is null then
    raise exception 'Complaint not found.';
  end if;

  select role into v_actor_role
  from public.users
  where id = p_assigned_by
  and is_active = true;

  if v_actor_role is null then
    raise exception 'Assigning user not found or inactive.';
  end if;

  select role into v_target_role
  from public.users
  where id = p_assigned_to
  and is_active = true;

  if v_target_role is null then
    raise exception 'Target user not found or inactive.';
  end if;

  v_expected_role := public.admin_next_assignment_role(v_actor_role);

  if v_expected_role is null or v_target_role <> v_expected_role then
    raise exception 'Role % can assign only to %.', v_actor_role, v_expected_role;
  end if;

  insert into public.complaint_assignments (
    complaint_id,
    assigned_to,
    assigned_by,
    assigned_by_role,
    assigned_to_role,
    remarks,
    created_by
  )
  values (
    p_complaint_id,
    p_assigned_to,
    p_assigned_by,
    v_actor_role,
    v_target_role,
    p_remarks,
    p_assigned_by
  );

  update public.complaints
  set current_status = 'ASSIGNED',
      updated_at = now()
  where id = p_complaint_id;

  insert into public.complaint_status_history (
    complaint_id,
    from_status,
    to_status,
    activity_type,
    remarks,
    created_by,
    changed_by,
    created_at
  )
  values (
    p_complaint_id,
    v_current_status,
    'ASSIGNED',
    'ASSIGNMENT',
    p_remarks,
    p_assigned_by,
    p_assigned_by,
    now()
  );
end;
$$;

