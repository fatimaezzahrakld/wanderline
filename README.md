# Wanderline V3 — Luxury Editorial, Supabase Edition

A full Next.js travel inquiry platform upgraded directly from Wanderline V2. Includes public destination search/favorites, editorial destination pages, persistent booking inquiries, role-protected admin dashboard, destination create/edit/publish management, and image uploads to Supabase Storage.

## Prerequisites
- Node.js 20.9+; a Supabase project; npm.
- This is an **inquiry-management platform**, not an automated booking/availability/payment engine. “Confirmed” is an internal inquiry status, not a provider-issued reservation.

## 1. Prepare Supabase
1. Create a project at https://supabase.com/dashboard.
2. SQL Editor → run `supabase/schema.sql` **first**, then `supabase/seed.sql`.
3. Authentication → Users → Add user → create an admin user with a strong password and verified email (or sign up through Supabase dashboard/auth flow).
4. Copy that user's UUID, then run in the SQL Editor (substitute actual UUID):
   ```sql
   insert into public.admin_users(user_id) values ('PASTE-AUTH-USER-UUID') on conflict do nothing;
   ```
5. Project Settings → API → copy Project URL and publishable/anon key. **Never put service_role or secret key into NEXT_PUBLIC variables.**
6. The SQL script creates a public `destination-images` bucket with upload permission restricted to verified admins by RLS.

## 2. Configure & run
```powershell
copy .env.example .env.local
```
Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
```powershell
npm install
npm run dev
```
Open http://localhost:3000. Access /inquire for live form, /admin/login for staff sign-in, /admin for dashboard. Do not run npm in the parent extracted folder; use the directory containing `package.json`.

## 3. Verify end to end
1. Confirm all six seeded places appear on the homepage; open one destination detail.
2. Submit `/inquire` with a valid name, email, date and guests. Success page means the insert was accepted.
3. Log in at `/admin/login` with the admin you registered in the `admin_users` table.
4. Confirm the request appears in the dashboard. Change its status and save.
5. Expand a destination, change copy or publish state and save. Refresh public page to see updates.
6. Upload a JPG/PNG/WebP/AVIF under 5MB. New cover should appear on public site after refresh.
7. Test that non-admin users cannot open `/admin`; check Supabase Row Level Security policies.

## 4. Production launch
- `npm run lint` and `npm run build` before deployment; push to GitHub and connect to Vercel.
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel Project Settings → Environment Variables; redeploy.
- Set your deployed origin in Supabase Auth → URL Configuration as appropriate for auth flows.
- **Before exposing forms to significant public traffic**, add CAPTCHA/Turnstile, request throttling, notification email delivery, and a privacy/retention policy suited to your jurisdiction. Honeypot and form validation alone do not prevent automated abuse.
- Only admins can read inquiries, and only admins can edit destinations or upload artwork. The public storage bucket makes uploaded artwork URLs accessible to anyone with the URL; don't upload sensitive files.
- External Unsplash photos load over the network; local SVG illustrations are included as fallbacks. Check image rights before commercial use.
- No email notifications are sent yet; new requests appear in the admin dashboard. The inquiry record is genuinely stored in Supabase, not a mailto draft.

## Source layout
- `src/app/actions.ts`: validated server mutations
- `src/lib/supabase.ts`: cookie-aware Supabase server client
- `src/lib/admin.ts`: verified-admin access guard
- `src/lib/catalog.ts`: database-backed public catalog
- `src/app/admin`: operations dashboard
- `supabase/schema.sql`: tables, RLS and storage policies
- `supabase/seed.sql`: six starter destinations

## Operational notes
- Slugs form the destination URL and existing inquiries reference them, so avoid changing slugs for active destinations. If you do, foreign-key behavior sets existing inquiries' destination to null on deletion; updates to referenced slugs may fail until references are resolved.
- The dashboard lists the 200 most recent inquiries, not the full all-time total. Expand with pagination for high volumes.
- Database configuration is required; the app intentionally does not silently fall back to fake demo responses.
