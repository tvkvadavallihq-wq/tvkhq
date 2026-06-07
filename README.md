# TVK Vadavalli HQ

Tamil-first grievance management platform for TVK Vadavalli HQ built with:

- Next.js 15 App Router
- TypeScript
- TailwindCSS
- Supabase Auth, PostgreSQL, and Storage
- React Hook Form, Zod, and TanStack Query

## What is included

- Public homepage with live ward directory, statistics, banners, and announcements
- Complaint registration, tracking, and public complaint listing
- Admin portal with complaint management and master-data management
- Notifications service interfaces for WhatsApp, SMS, and email
- Logging helpers for application errors and audit trails
- Rate limiting, sanitization, and RLS-aware server routes
- Deployment and Supabase setup documentation
- Seed script with sample content

## Local setup

1. Install dependencies
   ```bash
   npm install
   ```
2. Copy environment values into `.env.local`
3. Run the app
   ```bash
   npm run dev
   ```

## Environment variables

See [`.env.example`](./.env.example).

Minimum required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional notification placeholders:

- `WHATSAPP_API_URL`
- `WHATSAPP_API_TOKEN`
- `SMS_API_URL`
- `SMS_API_TOKEN`
- `EMAIL_API_URL`
- `EMAIL_API_TOKEN`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run seed
```

## Routes

- `/`
- `/complaint/new`
- `/complaints`
- `/track`
- `/admin/login`
- `/admin/dashboard`
- `/admin/complaints`
- `/admin/complaints/[complaintId]`
- `/admin/masters`

## Notes

- Admin access is session-based through Supabase Auth.
- Complaint updates and assignments are written through audited database RPC helpers.
- This repository is designed to be deployed on Vercel with Supabase as the backend.
