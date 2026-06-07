# Supabase Setup Guide

## 1. Create the project

- Create a Supabase project.
- Copy the project URL, anon key, and service role key into `.env.local`.

## 2. Apply migrations

Run the SQL files in `supabase/migrations` in order:

1. `202606070001_initial_schema.sql`
2. `202606070002_storage.sql`
3. `202606070003_complaint_registration_workflow.sql`
4. `202606080001_admin_complaint_management.sql`
5. `202606080002_audit_logs.sql`

## 3. Storage

Create the complaint media bucket:

- `complaint-media`

The app uses this bucket for complaint images and videos.

## 4. Authentication

- Enable the Auth providers you need.
- Create at least one admin user in `public.users` with a matching `auth.users.id`.
- Set the role to `SUPER_ADMIN`, `WARD_SECRETARY`, `AREA_COORDINATOR`, or `VOLUNTEER`.

## 5. Row Level Security

RLS is enabled on the production tables. The key rules are:

- Public read access is limited to active public content
- Complaint management is scoped by role and ward
- Only super admins can manage categories, banners, and announcements
- Audit logs are readable by super admins

## 6. Seed data

Seed the sample records with:

```bash
npm run seed
```

## 7. Verification

Confirm these tables exist and are populated:

- `wards`
- `area_pocs`
- `complaint_categories`
- `complaints`
- `complaint_media`
- `complaint_status_history`
- `complaint_assignments`
- `users`
- `ward_contacts`
- `banners`
- `announcements`
- `audit_logs`
