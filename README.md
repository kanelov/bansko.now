# Bansko NOW

Custom Next.js MVP for a fast, editorial local lifestyle platform about Bansko, Bulgaria.

## Stack

- Next.js App Router
- Tailwind CSS
- Supabase Auth, Database, and Storage
- Vercel-ready deployment

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL`.
3. Run the SQL in `supabase/schema.sql` in your Supabase SQL editor.
4. Create admin users manually in Supabase Auth. Public registration is not implemented.
5. Install dependencies and run:

```bash
pnpm install
pnpm dev
```

The app has graceful fallback content when Supabase env vars are missing, so the public MVP can build before the production project is connected.

## ART GALLERY APP integration

The Art Studio gallery reads published products from the protected ART GALLERY APP API. Add these server-only variables to Bansko NOW:

```text
ART_GALLERY_CATALOG_API_URL=https://app.kanelov.com/api/public-catalog
ART_GALLERY_RESERVATION_API_URL=https://app.kanelov.com/api/reservations
ART_GALLERY_INTEGRATION_SECRET=the-same-long-random-secret-as-the-source-app
```

The secret must never use a `NEXT_PUBLIC_` prefix. Catalog responses are cached by Next.js for five minutes. Pickup requests are written to the source system, receive a `BN-YYYY-######` reference, and do not use online payment.
