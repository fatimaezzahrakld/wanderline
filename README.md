# WANDERLINE V2 — Luxury editorial travel concept

A polished portfolio-ready Next.js travel discovery demo. Includes a cinematic homepage, six destination pages, live search, category filters, favorites saved to browser localStorage, responsive navigation, an about page, and an inquiry form that composes an email. **No payments, real bookings or backend are implemented.**

## Run locally

1. Install Node.js 20.9+.
2. Open the `wanderline-v2` directory (the one containing `package.json`).
3. Run `npm install`.
4. Run `npm run dev`.
5. Open http://localhost:3000.

## Production check

```bash
npm run lint
npm run build
npm run start
```

## Photography / offline behavior

The site requests travel photography from Unsplash URLs at runtime. **If those photos cannot load, the locally bundled original vector landscapes display instead.** Online use requires internet for the remote photos. If you need a fully offline photographic site, download licensed photos and replace `src/data/photos.ts` and the image component with local assets. Attribution and licensing should be checked before commercial deployment.

## Customize

- Site text and structure: `src/app/page.tsx`
- Destinations: `src/data/destinations.ts`
- Photo references: `src/data/photos.ts`
- Layout and design: `src/app/globals.css`
- Inquiries: change `hello@example.com` in `src/app/inquire/page.tsx` to your email.
- Global metadata: `src/app/layout.tsx`

## Deploy

Push to GitHub and import into Vercel, or deploy to any hosting environment supporting Next.js.

This is an independent fictional travel-site demo, not an operational travel agency.
