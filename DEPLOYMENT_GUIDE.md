# Deployment Guide

## Vercel

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Set the environment variables from [`.env.example`](./.env.example).
4. Make sure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set in the Vercel project settings.
5. Deploy the production branch.

Recommended Vercel settings:

- Framework preset: Next.js
- Build command: `npm run build`
- Output: default

## Supabase

1. Create or connect your Supabase project.
2. Run the SQL migrations in `supabase/migrations`.
3. Create the Storage bucket used by complaint uploads.
4. Enable Auth providers you plan to use for administrators.
5. Seed sample data if you want a populated staging environment:
   ```bash
   npm run seed
   ```

## Production checklist

- Verify all required environment variables exist in Vercel.
- Verify the `complaint-media` bucket exists.
- Confirm RLS is enabled and policies are applied.
- Create at least one `SUPER_ADMIN` row in `public.users` mapped to a Supabase auth user.
- Smoke test the routes:
  - `/`
  - `/complaint/new`
  - `/complaints`
  - `/track`
  - `/admin/login`
  - `/admin/dashboard`

## Performance notes

- Public and admin pages fetch only the columns they need.
- Pagination is server-side for complaint listings.
- Route-level loading states are provided for the heavier screens.

## Security notes

- Complaints and admin data are protected by RLS.
- Admin mutation routes enforce session checks and rate limits.
- Input values are sanitized before writes.
- Audit events are written for complaint and master-data operations.
