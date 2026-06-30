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
