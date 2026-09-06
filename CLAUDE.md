# CLAUDE.md - Bansko NOW project handoff

This file is the working context for Claude Code. Read it before changing code.

## 1. Communication and owner

- Speak with the owner, Lubo Kanelov, in Bulgarian.
- Explain actions in practical language. Avoid unexplained framework jargon.
- This is a production website. Inspect the existing implementation before editing.
- Continue through implementation, validation, Git, and deployment when the owner asks for a change. Do not stop at a proposal unless the owner explicitly asks for planning only.
- Never print, commit, paste into documentation, or expose environment variable values, API keys, service-role keys, Stripe secrets, Resend keys, or the shared gallery integration secret.

## 2. Product goal

Bansko NOW is a bilingual premium local editorial platform for Bansko and Pirin:

- Bulgarian is the primary language.
- English is available under `/en`.
- The main purpose is publishing fast, attractive, SEO-optimized articles.
- The site also contains local businesses, Art Studio services/products, a synced gallery catalog, weather, community links, donations, and an admin panel.
- Community discussion belongs mainly in the Facebook group, not in website comments.
- The public site should feel like a modern digital magazine, not a WordPress blog or a generic news portal.

Non-negotiable priorities:

1. Correct public rendering and editorial workflow.
2. SEO and bilingual consistency.
3. Mobile usability and Core Web Vitals.
4. Low Supabase egress and minimal client JavaScript.
5. Security: RLS, server-only secrets, no public admin registration.
6. No unnecessary architecture or large refactors.

## 3. Repositories: do not confuse them

There are three different projects in the owner's workspace.

### A. Bansko NOW - this repository

- Local path: `/Users/lubokanelov/Documents/GitHub/bansko.now`
- GitHub: `https://github.com/kanelov/bansko.now.git`
- Working branch at handoff (2026-09-01): `codex/art-studio-commerce-mvp`, HEAD `fd9e7d0` (`Bypass Vercel optimization for product images`).
- Since 2026-09-05 `main` is the single working branch: it contains the former production branch `claude/blog-structure` (blog structure + photo library) merged with the old `main` (PR #1) plus the header menu fix. Work on `main` from any computer (`git switch main && git pull --ff-only`); commit and push to `main`. `claude/blog-structure`, `claude/bansko-header-menu-fix-firtcr` and the `codex/*` branches are history only, do not base new work on them.
- Owner-facing change log and planned work: `CHANGELOG.md`. Add an entry there after every change.
- Production: `https://bansko.now`
- Vercel project: `bansko-now`
- Vercel project ID: `prj_RBSY4G7tNRU7Gw7HHV6P16gPf4LZ`
- Vercel team ID: `team_Ijdyu2h997ot1mqArESTOW53`
- Supabase project ref: `rzjyawjdhcedddydmfge`

### B. Source inventory/request/kiosk application

This is the source of the products shown under Bansko NOW `/art-studio/gallery`.

- GitHub remote: `https://github.com/kanelov/-.git`
- Production: `https://app.kanelov.com`
- Supabase project ref: `iofvptxecyxpqaozjtfm`
- The owner may refer to it as the stock receipt, request, kiosk, catalog, gallery, or source application.
- It is a static HTML/CSS/JavaScript app plus Vercel Functions in `/api`.
- It has no normal npm build step.
- Its whole site is intentionally `noindex, nofollow`; Bansko NOW is the indexable public catalog.
- The shared catalog/reservation API is the only supported bridge between the two projects.

Important branch state observed on 2026-09-01:

- Latest fetched source `main`: `403bcb0` (`Make WooCommerce CSV actions visible`). Always fetch again because it may advance.
- Integration feature branch: `codex/bansko-now-work-queue-and-categories`.
- Feature branch HEAD: `0e33ee9` (`Track real and external product requests`).
- Common base between the feature branch and current `main`: `7a8aa45`.
- Feature-only commits, oldest first:
  - `1102d94` - localized Bansko NOW catalog editor.
  - `059e134` - shared Most Liked kiosk categories.
  - `0e33ee9` - real and externally tracked request counters.
- `main` has many newer commits for WooCommerce, scanner, limited editions, counters, mobile layout, and supplier tools.

**Do not deploy the old feature branch directly and do not replace current `main` with it.** Create a new branch from the latest source `main`, inspect the three commits, and port only the intended behavior while preserving all newer work. Expect conflicts in `app.js`, `design-system.css`, `index.html`, and SQL migrations.

Suggested source checkout:

```bash
git clone https://github.com/kanelov/-.git ~/Documents/GitHub/stokova-razpiska-zaqavka
cd ~/Documents/GitHub/stokova-razpiska-zaqavka
git fetch --all --prune
git switch main
git pull --ff-only origin main
git switch -c claude/bansko-now-integration
git fetch origin codex/bansko-now-work-queue-and-categories
```

Use the commits as references. Do not blindly cherry-pick all three over a newer `main`.

### C. Kanelov Art - unrelated unless explicitly requested

- Local path: `/Users/lubokanelov/Documents/GitHub/kanelov-art`
- This is an AI product-generation/WooCommerce/Etsy pipeline.
- It is not the request/kiosk source application.
- Do not edit it for Bansko NOW tasks unless the owner explicitly asks.

## 4. Current live state at handoff

Verified on 2026-09-01:

- `https://bansko.now/art-studio/gallery/alpaka-sa3450tee` returned HTTP 200.
- Bansko NOW already has the corrected top product navigation:
  - `Назад` uses browser history back.
  - `Напред` uses browser history forward.
  - A separate lower row keeps `Предишен продукт` and `Следващ продукт` within the current category/context.
  - `Начало` and `Най-харесвани` remain in the compact top menu.
- The implementation is in:
  - `src/components/public/gallery-history-buttons.tsx`
  - `src/components/public/gallery-product-navigation.tsx`
  - commit `55553ca` (`linmit`)
- Product images use direct image URLs instead of the Vercel image optimizer in the latest commit. Preserve this until there is a measured reason to change it; it avoids unnecessary image optimization traffic for source Supabase images.

The source app at `https://app.kanelov.com` returned HTTP 200, but its live `app.js` did **not** contain the new two-counter UI at the time of handoff. The counter work exists on branch `codex/bansko-now-work-queue-and-categories`, commit `0e33ee9`, and still needs to be reconciled with current source `main`, migrated, tested, and deployed.

## 5. Local start for Bansko NOW

```bash
cd /Users/lubokanelov/Documents/GitHub/bansko.now
git fetch --all --prune
git switch main
git pull --ff-only origin main
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm build
pnpm dev
```

Local URL: `http://localhost:3000`.

Notes:

- `.env.local` is ignored by Git. Never overwrite it without inspecting its variable names first.
- Local `NEXT_PUBLIC_SITE_URL` may be `http://localhost:3000`; Vercel production must use `https://bansko.now`.
- If the local environment has a Turbopack-specific build issue, validate once with `pnpm exec next build --webpack`, but keep normal Vercel configuration unchanged unless there is a real production failure.
- Existing ESLint warnings for deliberate raw `<img>` usage may exist. Do not convert all images mechanically. Some source images intentionally bypass Vercel optimization to reduce cost/traffic.

## 6. Stack and high-level architecture

- Next.js `16.1.6`, App Router.
- React `19.2.4`.
- Tailwind CSS `4.3.1` through PostCSS.
- Supabase Auth, Postgres, RLS, and Storage.
- Vercel deployment.
- Resend for contact/admin notification email.
- Stripe for native Art Studio checkout/webhooks and support links where configured.
- Open-Meteo for weather.
- Font Awesome packages rendered through the local `IconGlyph` abstraction.
- Markdown article body rendered with `react-markdown` and `remark-gfm` plus custom blocks.

Important directories:

```text
src/app/(site)/[locale]/     Public BG/EN pages
src/app/admin/               Supabase-authenticated admin
src/app/api/                 Search, weather, Stripe webhook
src/components/public/       Public reusable UI
src/components/admin/        Admin editors and shell
src/lib/content.ts           Articles/categories/pages/settings data access
src/lib/gallery-catalog.ts   Server-only bridge to the source catalog API
src/lib/businesses.ts        Business admin/data access
src/lib/business-public.ts   Public business projection
src/lib/art-studio.ts        Native Art Studio commerce content
src/lib/i18n.ts              Locale helpers and shared UI dictionaries
src/lib/env.ts               Environment variable access and safe defaults
src/lib/supabase/            Browser/server/admin Supabase clients
src/lib/types.ts             Database and application types
src/app/sitemap.ts           One multilingual sitemap implementation
src/app/robots.ts            Robots metadata
src/proxy.ts                 BG rewrite, EN prefix, and admin auth cookie refresh
supabase/                    Base schema and additive migrations
```

## 7. Routing and multilingual rules

- Bulgarian public URLs have no language prefix: `/nature`, `/articles`, `/art-studio/gallery/...`.
- English public URLs use `/en`: `/en/nature`, `/en/articles`, `/en/art-studio/gallery/...`.
- Internal routes use `[locale]`; `src/proxy.ts` rewrites unprefixed public requests to `/bg/...`.
- `/bg/...` redirects permanently to the clean unprefixed BG URL.
- Do not change this URL structure.
- Always build links through `localePath()` and absolute SEO URLs through `localeUrl()` from `src/lib/i18n.ts`.
- Shared interface labels belong in the BG/EN dictionaries in `src/lib/i18n.ts` or in localized site settings, not as BG-only text in a public component.
- BG and EN articles are separate Supabase records linked by `translation_group_id`.
- Product/category translations in the synced gallery also have independent locale records and publication status.
- Never expose a draft translation through `hreflang`, sitemap, search, or public queries.
- Each locale must have a self-canonical URL. EN must never canonicalize to BG.
- `html lang`, metadata, Open Graph, JSON-LD, alt text, caption, slug, and descriptions must use the current localized record.

## 8. Public article architecture and SEO

Main public article file:

```text
src/app/(site)/[locale]/[categorySlug]/[articleSlug]/page.tsx
```

Related files:

```text
src/lib/content.ts
src/lib/seo.ts
src/components/public/markdown-renderer.tsx
src/components/public/article-table-of-contents.tsx
src/components/public/article-share-actions.tsx
src/components/public/source-links.tsx
src/app/sitemap.ts
```

Article requirements to preserve:

- Published records only on public pages.
- Draft and scheduled/unpublished records must not leak publicly.
- Real featured `<img>` uses `featured_image_url` and localized `featured_image_alt`.
- Localized caption and photo credit remain attached to the image.
- Dynamic title/description, Open Graph, Twitter card, canonical, and mutual BG/EN `hreflang`.
- Article/NewsArticle JSON-LD, BreadcrumbList, optional FAQ schema, and featured ImageObject/primary image semantics where already implemented.
- `mainEntityOfPage` must match the current canonical URL.
- The same physical image URL may be used for BG and EN; do not duplicate the file only for language.
- Sitemap includes published BG and EN URLs separately and includes discoverable featured image data.
- Keep exactly one sitemap system in `src/app/sitemap.ts`.

Markdown/custom article features are centralized in `src/lib/markdown-blocks.ts` and `src/components/public/markdown-renderer.tsx`. Do not invent a second parser. Keep the admin guide in `src/app/admin/(protected)/guide/page.tsx` synchronized whenever article syntax or publishing behavior changes.

## 9. Admin and content model

- Admin URL: `/admin`.
- Authentication: Supabase Auth; no public registration.
- Protected admin layout: `src/app/admin/(protected)/layout.tsx`.
- Admin writes use Server Actions and server Supabase clients.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be imported into client components.
- Public reads rely on RLS and published/status filters.

Main admin areas:

- Dashboard.
- Articles, new article, and edit article.
- Categories and localized SEO.
- Media.
- Site settings.
- Navigation, logo, social links, and support button.
- CMS/editable pages.
- Businesses.
- Native Art Studio admin.
- Site guide/instructions.

When adding an admin feature:

1. Reuse an existing protected page or the admin shell.
2. Prefer tabs/sections over making the already dense admin navigation longer.
3. Add validation on the server, not only in the browser.
4. Update `src/lib/types.ts` when the database shape changes.
5. Update the admin guide in the same change.

## 10. Supabase schema and migration safety

Bansko NOW base schema starts in `supabase/schema.sql`, but production also has additive migrations:

- `bilingual-content.sql`
- `pages-and-art-studio.sql`
- `business-directory.sql`
- `support-and-business-tiers.sql`
- `simplify-business-visibility-plans.sql`
- `header-navigation-settings.sql`
- `article-native-block-settings.sql`
- `art-studio-commerce-mvp.sql`
- `content-hub-publish.sql` (adds `articles.content_hub_item_id` + unique index; required by `/api/content/publish`)
- other focused seed/index files in `supabase/`

Do not rerun or rewrite the full base schema blindly on production. For a new change:

1. Inspect the live table/function/policy first.
2. Create a small additive, idempotent SQL migration.
3. Use `if not exists`, `create or replace`, guarded constraint changes, and explicit grants/revokes where appropriate.
4. Preserve current data.
5. Keep RLS enabled.
6. Public policies must expose only published/approved public fields.
7. Service-role operations belong only in server code.
8. Check indexes for foreign keys and frequent status/locale/slug/category lookups.
9. Apply the migration to the correct Supabase project ref. There are two projects; confusing them is a serious error.

Never place private business owner contact fields or gallery customer details in public queries, public API responses, static page props, logs, or cacheable responses.

## 11. Environment variables

Use `.env.example` as the list of expected Bansko NOW variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
OPEN_METEO_API_BASE_URL
RESEND_API_KEY
ADMIN_NOTIFICATION_EMAIL
EMAIL_FROM
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ART_GALLERY_CATALOG_API_URL
ART_GALLERY_RESERVATION_API_URL
ART_GALLERY_INTEGRATION_SECRET
CONTENT_HUB_PUBLISH_SECRET
```

Production expectations:

```text
NEXT_PUBLIC_SITE_URL=https://bansko.now
ART_GALLERY_CATALOG_API_URL=https://app.kanelov.com/api/public-catalog
ART_GALLERY_RESERVATION_API_URL=https://app.kanelov.com/api/reservations
ADMIN_NOTIFICATION_EMAIL=mail@kanelov.com
```

The shared secret relationship is:

```text
Bansko NOW: ART_GALLERY_INTEGRATION_SECRET
Source app: BANSKO_INTEGRATION_SECRET
```

Their values must be identical in the two Vercel projects, server-side only. Never prefix either with `NEXT_PUBLIC_`.

A second, separate secret protects the reverse direction (Content Hub in the source app publishing articles into Bansko NOW):

```text
Bansko NOW: CONTENT_HUB_PUBLISH_SECRET   (Vercel env, production + preview; set on 2026-09-02)
Source app: stored per site in Supabase Vault through Настройки → Статии → Bansko NOW → Ключове
```

`SUPABASE_SERVICE_ROLE_KEY` was missing from the bansko-now Vercel production environment on 2026-09-02. The content publish endpoint (and the Stripe webhook) need it; the owner must add it in the Vercel dashboard.

Source app server variables:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
BANSKO_INTEGRATION_SECRET
```

Before deployment, inspect names with `vercel env ls`; do not print values into the chat or terminal transcript.

## 12. Native Art Studio vs synced gallery

There are two related but technically different product systems.

### Native Art Studio commerce

Routes:

```text
/art-studio/[typeSlug]
/art-studio/[typeSlug]/[productSlug]
/art-studio/order/success
```

Data lives in the Bansko NOW Supabase project in `art_studio_*` tables. Admin pages are under `/admin/art-studio`. This system supports native product types, options, offers, Stripe payment links/webhooks, delivery settings, and orders.

### Synced kiosk gallery

Routes:

```text
/art-studio/gallery
/art-studio/gallery/category/[categorySlug]
/art-studio/gallery/[productSlug]
```

Data does **not** live as a duplicate editable catalog in Bansko NOW. It is read from the source app's server API through `src/lib/gallery-catalog.ts`.

The source application remains the source of truth for:

- Inventory catalog product and SKU.
- Kiosk category tree and product/category relation.
- Availability, variants, and stock.
- Pickup requests/reservations and work queue.
- BG/EN public product/category translations and SEO fields.
- WooCommerce link and online-order availability.

Bansko NOW is responsible for:

- Public rendering.
- Locale routes.
- Canonical/hreflang/Open Graph/Product schema/Breadcrumb schema.
- Sitemap entries.
- Responsive visual gallery.
- Reservation form UI.
- Server-to-server call to the source reservation API.

Do not create a second Bansko NOW editable copy of synced product data. That would create conflicts and duplicate content.

## 13. Source API contract and caching

Bansko NOW calls:

```text
GET  https://app.kanelov.com/api/public-catalog
POST https://app.kanelov.com/api/reservations
```

Source files:

```text
api/public-catalog.js
api/reservations.js
server/supabase-rest.js
```

Catalog API modes:

- Default: product detail/full catalog RPC.
- `mode=cards`: paginated lightweight cards.
- `mode=categories`: category tree.
- `mode=sitemap`: published indexable products for sitemap.
- `context_for=<uuid>`: variants plus previous/next product in category context.

Current cache design:

- Source API cards/categories/context: `s-maxage=900`, stale while revalidate for one day.
- Source sitemap API: one day, stale while revalidate for seven days.
- Bansko server fetches gallery catalog/categories/context with `revalidate: 900`.
- Bansko sitemap gallery fetch uses `revalidate: 86400`.
- Reservation POST is `no-store`.

Do not add client-side periodic catalog polling. Do not fetch the whole inventory table for each page. Preserve pagination and lightweight RPC/view responses.

## 14. Reservation flow

1. Visitor opens a localized gallery product in Bansko NOW.
2. Visitor chooses variant and quantity and submits name plus phone or email.
3. Bansko NOW sends a server-to-server authenticated POST to the source `/api/reservations`.
4. Source validates input and calls `create_bansko_now_reservation` in source Supabase.
5. Client receives a reference such as `BN-2026-000002`.
6. Reservation appears in the source `Bansko NOW` tab.
7. Confirming it creates/links a normal work-queue request marked as Bansko NOW.
8. Source staff process it with normal request actions.
9. Reservation can be deleted with confirmation when cancelled or completed, according to the current source workflow.

Security rules:

- Reservation API requires the shared Bearer secret.
- Customer fields must never enter a public catalog response.
- `client_request_id` makes client submission idempotent.
- Do not log full contact information.
- Do not cache POST responses.

## 15. Pending source work: two request counters

Owner requirement:

- First counter: real requested quantity recorded in the request system only.
- Second counter: real requested quantity plus manually added external orders.
- `+` adds exactly one external order and persists it.
- A later real request increases both counters automatically.

Example:

```text
Real requests: 10
Tracked total: 10
Click +       -> real 10, tracked 11
New request   -> real 11, tracked 12
```

Reference implementation: source branch commit `0e33ee9`.

Database model used by that commit:

```text
inventory_catalog.total_requested_quantity
inventory_catalog.requested_quantity_adjustment
```

Derived values:

```text
real requested quantity = max(0, total_requested_quantity - requested_quantity_adjustment)
tracked total quantity   = max(0, total_requested_quantity)
```

`refresh_inventory_catalog_stats()` recalculates real request quantity from `inventory_requests` and adds the saved adjustment. The request trigger therefore raises both displayed totals when a real request is inserted/updated/deleted.

The manual `+` must use one atomic owner-only RPC:

```text
increment_inventory_catalog_order_adjustment(catalog_id, increment=1)
```

Reference migration:

```text
supabase-inventory-request-counters.sql
```

Reference UI labels:

```text
Заявки в системата: X бр.
Общо проследени: Y бр. [+]
```

The implementation must preserve source `main` improvements for limited edition counters, WooCommerce, scanner, mobile category layout, and counter styling. Reconcile the behavior manually instead of replacing the newer card renderer.

Low-egress requirements:

- Keep `inventory_catalog_light`; add `requested_quantity_adjustment` to that view.
- Use explicit selected columns.
- Use the RPC result to merge the new total into local state.
- Do not run an extra full catalog fetch after clicking `+`.
- Realtime/request triggers may update the row naturally.
- Disable the `+` while the request is pending to prevent double clicks.

Before applying SQL, run read-only inspection in source Supabase:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'inventory_catalog'
  and column_name in ('total_requested_quantity', 'requested_quantity_adjustment');

select routine_schema, routine_name
from information_schema.routines
where routine_name in (
  'refresh_inventory_catalog_stats',
  'increment_inventory_catalog_order_adjustment',
  'set_inventory_catalog_order_total'
);

select definition
from pg_views
where schemaname = 'public'
  and viewname = 'inventory_catalog_light';
```

Then compare the live definitions with the migration. Apply only what is missing. The private `security definer` function must check authenticated owner/admin access; revoke execution from `public` and `anon`. The public wrapper remains `security invoker` and authenticated-only.

## 16. Pending source integration commits

The same source feature branch also contains:

### `1102d94` - localized catalog editor

- BG/EN public product and category records.
- Separate publication status per locale.
- SEO title, description, focus keyword, alt, caption, Open Graph fields, robots flags, slug, descriptions.
- Bansko NOW admin subsection inside the existing source app, not a separate overloaded global admin.

### `059e134` - shared Most Liked categories

- Root `Най-харесвани` / `Most liked`.
- Child categories for T-shirts, Watercolours, Landscape photography, and Mugs.
- Same category tree feeds kiosk and Bansko NOW.
- Product assignment happens once in the source app.

### `0e33ee9` - request counters

- Two-counter UI and atomic external increment.
- Lightweight catalog view field.
- Additive SQL migration.

Before porting each feature, inspect current source `main`; some behavior may already exist in a newer form. Preserve current working features and data.

## 17. Performance and Supabase egress rules

The owner is close to the Supabase free-plan egress limit. Every data change must be reviewed for transfer volume.

Prefer:

- Server Components for public pages.
- Explicit column lists.
- Lightweight views/RPCs for public catalog data.
- Pagination and lazy loading.
- Next/Vercel cache with deliberate revalidation.
- Stable Storage URLs and browser/CDN caching.
- A single small mutation response merged into state.
- Server-only data access for private fields.

Avoid:

- `select('*')` on large/public paths when a projection is enough.
- Fetching all products merely to render one product.
- Duplicate BG/EN image files when the same physical image is intended.
- Repeated client polling.
- Re-fetching full inventory after one counter click.
- Base64 images in database rows.
- Proxying every image through a Vercel Function.
- Adding a second sitemap or a second product database.

When changing caching, document freshness tradeoffs. Editorial updates should remain reasonably fresh without turning every request into a Supabase query.

## 18. Design and interaction rules

- Preserve the existing premium editorial visual language: off-white, forest green, warm neutrals, large photography, restrained typography, clean spacing.
- Do not redesign unrelated pages during a functional task.
- No sidebars, banner ads, decorative gradients/orbs, or nested cards.
- Cards use small radii consistent with the current system.
- Public UI must be fully responsive and text must not overflow.
- Use familiar icons through `IconGlyph`/Font Awesome. Do not draw imitation icons.
- All buttons and icon buttons must have explicit contrast in normal, hover, focus, active, and disabled states.
- Forest/green hover backgrounds need white text and white/current-color icons.
- Use `focus-visible` states and accessible labels.
- For client navigation behavior such as browser Back/Forward, keep the client component tiny. Product/category data remains server-rendered.
- Do not regress square product image presentation in the synced gallery.
- Product gallery/lightbox keeps previous/next/close controls and keyboard accessibility.

## 19. SEO rules for synced gallery products

For each published localized product page preserve:

- Self-canonical.
- Mutual BG/EN hreflang only when both localized records are published.
- `x-default` to Bulgarian when BG exists.
- Localized title, description, slug, alt, caption, Open Graph values.
- Product JSON-LD and BreadcrumbList.
- Offer only when the product has a valid online offer; do not claim online availability otherwise.
- Indexing controlled by localized robots flags.
- BG and EN sitemap URLs as separate entries.
- Shared physical product image is allowed; localized text remains different.
- Source kiosk/app stays noindex to prevent duplicate search results.

The source catalog is authoritative for content. Bansko NOW is authoritative for final HTML rendering and metadata.

## 20. Validation checklist

### Bansko NOW code

```bash
pnpm typecheck
pnpm lint
pnpm build
git diff --check
```

After frontend changes, inspect desktop and mobile with a real browser and check the console. Minimum pages:

```text
/
/en
/articles
/en/articles
/art-studio/gallery
/art-studio/gallery/category/<known-category>
/art-studio/gallery/<known-product>
/en/art-studio/gallery/<known-en-product-if-published>
/admin/login
```

For the product navigation:

1. Open category.
2. Open product A.
3. Open product B through `Следващ продукт`.
4. Top `Назад` must return through browser history.
5. Top `Напред` must restore the page after going back.
6. Lower previous/next links must move within the active category and preserve `?from=<category-slug>`.

### Source app code

```bash
node --check app.js
git diff --check
```

Open source app as owner and kiosk user where relevant. Confirm:

- Existing WooCommerce, scanner, limited-edition, inventory, and request flows still work.
- `Заявки в системата` equals summed request quantity.
- `Общо проследени` equals real quantity plus external adjustment.
- `+` is owner-only, disabled while pending, increments once, and survives reload.
- A new normal/Bansko request increments both counters through the database trigger.
- No full catalog refetch occurs after `+`.

### End-to-end integration

- Catalog API returns only published/visible kiosk products.
- Product/category hierarchy matches source kiosk.
- Draft BG/EN translation is absent from public API, Bansko page, sitemap, and hreflang.
- Bansko reservation returns a BN number and appears in the source Bansko NOW tab.
- Confirmed reservation enters the shared work queue and remains marked as Bansko NOW.
- Do not create a real reservation or payment during automated testing without the owner's approval; use a clearly marked test record if approved and clean it up afterward.

## 21. Git and deployment procedure

Before edits:

```bash
git status --short
git branch --show-current
git pull --ff-only
```

Rules:

- Never discard unrelated owner changes.
- Never use `git reset --hard` or overwrite production data.
- Keep Bansko NOW and source app commits separate.
- Small changes go straight to `main`; use a short-lived feature branch from `main` only for larger work, and merge it back into `main` when done.
- Review `git diff` and run checks before commit.
- Push before deploying.
- Do not deploy the source integration branch while it is behind `main`.

Bansko Vercel deployment:

```bash
vercel link
vercel env ls
vercel deploy --prod
```

The repo already has `.vercel/project.json`; verify it still points to `bansko-now` before deploying. Do not accept a relink to a different project accidentally.

Source deployment:

- Confirm the Vercel project/domain for `app.kanelov.com` before deployment.
- Confirm current production `main` has been merged into the working branch.
- Confirm the source Supabase migration is applied first if the UI depends on a new column/RPC.
- Deploy the reconciled branch only after source regression testing.
- Verify `X-Robots-Tag: noindex, nofollow, noarchive` remains on source app pages.
- API image route may have a special header exception; preserve `vercel.json` behavior.

## 22. First continuation task for Claude Code

Unless the owner gives a newer priority, continue in this order:

1. Read this file and inspect both repositories.
2. Fetch the latest source `main` and compare it with `codex/bansko-now-work-queue-and-categories`.
3. Do not modify Bansko navigation; it is already live and correct.
4. Reimplement the two-counter behavior from `0e33ee9` on top of latest source `main`, preserving newer counter/limited-edition/Woo/scanner work.
5. Inspect source Supabase before applying `supabase-inventory-request-counters.sql`; apply only missing definitions.
6. Run source syntax and browser regression tests.
7. Deploy the reconciled source app to the existing Vercel project.
8. Verify live counters and then run a controlled end-to-end Bansko request test with owner approval.
9. Update this `CLAUDE.md` if architecture, branch state, migration state, or operating rules change.

## 23. Final guardrails

- Do not expose private keys or private customer/business contact data.
- Do not edit the wrong Supabase project.
- Do not deploy an old source branch over a newer `main`.
- Do not duplicate synced catalog data in Bansko NOW.
- Do not remove localized SEO metadata while simplifying UI.
- Do not trade low egress for stale or incorrect public content without discussing the tradeoff.
- Do not change design globally to fix one component.
- Do not claim a migration or deployment succeeded without verifying it.
- Keep the owner-facing admin guide and this handoff document current as the system evolves.

## 24. Content Hub publish endpoint (2026-09-02)

The source request app (`https://app.kanelov.com`) has a Content Hub module („Статии“) that approves AI-generated articles and publishes them to several sites. Bansko NOW receives them through its own API; the two Supabase projects are never linked directly.

- Route: `src/app/api/content/publish/route.ts` (`runtime = nodejs`, `force-dynamic`).
  - `GET` returns `{ ok, site, categories[] }` for the category dropdown and the connection test.
  - `POST` creates or updates one article. Idempotent by `articles.content_hub_item_id` (unique partial index). Slug collisions get `-2`, `-3`, … suffixes.
- Auth: `Authorization: Bearer <CONTENT_HUB_PUBLISH_SECRET>` compared with `timingSafeEqual`. Server-to-server only. Returns 503 when the secret or the service role key is missing.
- Logic: `src/lib/content-hub.ts` (`parseContentHubPayload`, `listContentHubCategories`, `publishContentHubArticle`). Shared article helpers (`syncTags`, `publishArticleRecord`, `revalidateEditorialPaths`, `mediaBucket`) were extracted to `src/lib/articles-admin.ts` and are used by both the admin actions and the endpoint.
- Content must be Markdown (HTML is rejected with 422). The category is matched by slug, translated name or base name, then by `fallback_category`; unknown categories return 422 with the available slugs.
- Featured images are copied into `bansko-media/articles/content-hub/<item-id>.<ext>` (deterministic path, upsert) and registered in `media`; on failure the original URL is kept and a warning is returned.
- Fields written: title, slug, excerpt, content, category, featured image + alt + caption, seo_title, seo_description, focus_keyword, canonical_url, og_*, robots_*, reading_time, author_name, source_links, schema_type, locale, `automation_source = 'content_hub'`, `automation_last_imported_at`, `content_hub_item_id`. Status `published` (published_at kept on re-publish) or `draft`.
- After writing it revalidates the editorial paths, the article path, the category path and `/admin/articles`.
- Migration: `supabase/content-hub-publish.sql` must be applied to project `rzjyawjdhcedddydmfge` before the first publish.
- Testing without a real publish: `GET` with the secret returns categories; `POST` with an unknown category returns 422 without writing. A real test writes a `status: draft` article that must be deleted afterwards from `/admin/articles`.

## 25. Blog structure, caching and images (2026-09-02)

- **Categories have `is_visible`.** Public queries (`getCategories`, `getCategoryBySlug`) return visible categories only; pass `{ includeHidden: true }` in the admin. A hidden category page returns 404, is not in the menu or the sitemap. `publishArticleRecord()` and the Content Hub endpoint make the category visible when an article is published into it. Visible categories with zero published articles render with `noindex` and stay out of the sitemap. Only „Банско сега“ (`now`) was visible at handoff; the four published articles were moved into it.
- **Article URL by category.** `/{categorySlug}/{articleSlug}` redirects permanently to the article's current category path when the category changed. The old `/art-studio/...` article URLs are redirected in `next.config.ts` because the shop route shadows them.
- **Header menu.** „Статии“ is a built-in dropdown (desktop: CSS hover/focus, mobile: nested `<details>`) listing „Всички статии“ plus visible categories with counts from `getPublishedArticleCounts()`. It is not a `navigation_items` row. Active nav rows at handoff: Art Studio, Бизнеси, Галерия.
- **Caching.** Home, `/articles`, category and article pages export `revalidate = 900`; admin and Content Hub publishing still call `revalidatePath`. Do not add dynamic APIs (cookies/headers) to public pages or they fall back to per-request rendering. `revalidatePath()` matches the **internal** route, and BG pages render under `/bg/...` because `src/proxy.ts` rewrites the unprefixed URLs, so always revalidate through `revalidateLocalePath()` / `revalidatePublicPath()` in `src/lib/articles-admin.ts`. Calling `revalidatePath("/now")` or `revalidatePath("/")` silently misses the BG pages and the change only appears after the 15 minute window (fixed 2026-09-03). The `type: "layout"` form (and any `[param]` pattern) is matched against the **route pattern** `/[locale]/...`, so `revalidatePath("/bg", "layout")` matches nothing; the helpers now turn such calls into `/(site)/[locale]/...` automatically (the route group is part of the tag, check `.next/server/app/bg.meta` after a build) and refresh both locales at once (fixed 2026-09-05, the header menu did not refresh after „Запази менюто“).
- **Light queries.** `getPublishedArticles()` selects `articleListColumns` (no body) unless `{ full: true }`. Search uses `searchPublishedArticles()` (database `ilike`, light rows). Keep it that way; the owner is close to the Supabase egress limit.
- **Responsive images.** `src/lib/image-variants.ts` (sharp) stores new uploads as `articles/r/<yyyy-mm>/<id>-w480|w960|w1600.webp`; `ResponsiveImage` builds the `srcset` from the `-w1600.webp` name, older single files render unchanged. Used by the admin media upload and the Content Hub endpoint. Do not route these through Vercel image optimization.
- **No stock photos.** Product type, product and service cards render a colour panel when no image is set instead of Unsplash fallbacks. Real photos are uploaded in the admin.
- **Security headers** (nosniff, SAMEORIGIN, referrer policy, permissions policy) are set in `next.config.ts`.
- **Art Studio page** (`/art-studio`) is a static-content page with Store, FAQPage and BreadcrumbList schema; hero/eyebrow/excerpt/content/CTA still come from the editable page `art-studio` when set.

## 26. Art Studio selling pages and enquiry orders (2026-09-02)

- `/art-studio` has no hero: intro + clickable product type cards (`ArtStudioProductTypeCard`, image = type image or first product image), then trust strip, CMS content, gallery collections, services, steps, custom projects, FAQ.
- `/art-studio/[typeSlug]` is a selling landing page: copy from `art_studio_product_type_translations.content` (Markdown, optional `:::faq`) or defaults in `src/lib/art-studio-copy.ts` keyed by `internal_name`; designs grid; sticky `ArtStudioEnquiryForm`; Product (AggregateOffer), FAQPage, BreadcrumbList and ItemList schema; ISR 15 min with `generateStaticParams`.
- `/art-studio/[typeSlug]/[productSlug]` uses the same enquiry form (plus product options and price options). Stripe checkout code (`ArtStudioOrderForm`, `createArtStudioOrderAction`, webhook) stays in the repo but is not rendered; the owner chose contact-form ordering.
- Enquiry action `submitArtStudioEnquiryAction` (`src/app/(site)/[locale]/art-studio/actions.ts`): validates `form_config` fields (`src/lib/art-studio-forms.ts`), stores `art_studio_orders` rows with `request_type = 'enquiry'`, uploads the optional photo to the private bucket `art-studio-orders` (`<yyyy-mm>/<order>/<file>`), emails the owner (signed URL valid 7 days) and the customer, then redirects to `/art-studio/order/success?type=enquiry&ref=…`; errors go to the same page with `status=error&code=…`. Pages never read `searchParams`, so they stay cached.
- `art_studio_product_types.form_config` (jsonb) is edited as JSON in the admin products page; seeded for the four types. `art_studio_product_type_translations.content` holds the selling copy.
- Form options render as pill radios (`display: "select"` for a dropdown). Options accept `tags`, fields accept `filter_by: { field, map }` to narrow dependent options (for example sizes by model).
- Live sizes: `form_config.source_sizes` (`types`, optional `variants_include`, `labels_en`, `replaces`, `required`) takes product types and size variants from the request app through `GET /api/public-catalog?mode=variant-options` (`getSourceVariantOptions()` in `src/lib/gallery-catalog.ts`, cached 900 s). Static fields listed in `replaces` are hidden while the source data is available; if the source is unreachable the static fields are used again.
- Every enquiry is mirrored into the request app: `createArtStudioSourceOrder()` posts to `POST https://app.kanelov.com/api/art-studio-orders` (Bearer `ART_GALLERY_INTEGRATION_SECRET`, override URL with `ART_GALLERY_ART_STUDIO_API_URL`). The source function `create_bansko_now_art_studio_order` creates a confirmed `gallery_pickup_reservations` row and an open `inventory_requests` row, both `source_channel = 'art_studio'`, keyed by the bansko.now order id (idempotent) and carrying the order number. Placeholder SKUs `ART-STUDIO-*` (`form_config.source_sku`, default by `internal_name`). The result is stored in `art_studio_orders.source_request_id` / `source_synced_at` (`supabase/art-studio-source-sync.sql`); a failed sync only adds a warning row to the owner email. Source migration: `supabase-art-studio-orders.sql` in the request app repo (branch `claude/content-hub`), docs in `docs/art-studio-orders.md` there. The owner applied that migration on 2026-09-02; a live test order (BN-2026-4E977ABD) synced successfully. **2026-09-06:** that endpoint, `mode=variant-options` and the status forwarding existed only in a Mac deployment and were overwritten on 2026-09-04; they were re-implemented in the request app repo on `main` (`api/art-studio-orders.js`, `api/bansko-now-order-sync.js`, `supabase-art-studio-orders.sql`, RPC `create_bansko_now_art_studio_order(p_payload jsonb)`). A print ordered from the photo archive (`?photo=<slug>` on the print type page, hidden field `photo_slug`) is booked on the photo's catalog row: `catalog_sku` = `photos.catalog_sku` or the photo code, `product.photo_code` and the thumbnail travel with the order.
- `/art-studio/[typeSlug]/designs` lists all ready designs of a type; the type page shows the first four and links there.
- Form options: `swatch` (CSS colour) renders a colour dot in the pill; `show_when: { field, values }` shows a field only for certain values of another field (frame colour only when framed). `source_sizes.types` entries may be objects `{ label_bg, label_en, types: [...] }` merging several source product types into one model choice (kids + baby T-shirts). Pill labels are shortened for display only (`displayVariantLabels`); the full catalog label is stored with the order.
- Editable page texts: `art_studio_public_settings.page_copy` (jsonb `{ landing: { bg, en }, types: { <internal_name>: { bg, en } } }`) edited in `/admin/art-studio/copy` („Текстове“); defaults and the resolvers (`resolveArtStudioLandingCopy`, `resolveArtStudioTypeCopy`) live in `src/lib/art-studio-copy.ts`. Type pages show a thumbnail strip (`ArtStudioThumbnailStrip`) from `art_studio_product_types.gallery_urls` plus product images (`supabase/art-studio-page-copy.sql`).
- `page_copy` also carries `landing_sections`, `type_sections` (booleans + `designsCount`) and `landing_links` (`gallery`, `custom`); resolvers `resolveArtStudioLandingSections/TypeSections/LandingLinks`. Type copy includes form texts (`formEyebrow`, `formIntro`, `cta` = form button) passed to `ArtStudioEnquiryForm` as `formCopy`.
- Admin theme (2026-09-02): warm latte palette with forest accents through CSS variables `--admin-bg/--admin-side/--admin-panel/--admin-panel-strong/--admin-line/--admin-ink/--admin-muted` in `globals.css`; admin pages use `bg-[var(--admin-panel)]`, `border-[var(--admin-line)]`, `text-[var(--admin-muted)]` instead of the old dark `bg-white/5`, `border-white/10`, `text-stone-300/400`. `AdminShell` is async and shows a "Поръчки" tab with the count of `production_status = 'new'` orders. Reverse sync: the request app forwards status events (`ready`, `collected`, `cancelled`, `expired`, `deleted`, `request_deleted`, `request_printed`, `request_restored`) through its own `api/bansko-now-order-sync.js` (owner JWT → shared secret) to `POST /api/art-studio/orders/sync` here (`src/app/api/art-studio/orders/sync/route.ts`, Bearer `ART_GALLERY_INTEGRATION_SECRET`). Orders get `source_status`, and cancelled/deleted/collected ones get `archived_at` + `archive_reason` (`supabase/art-studio-order-archive.sql`). The admin orders page has „Активни“ / „История“ tabs (`?tab=history`), `archiveArtStudioOrderAction` moves orders manually, and `updateArtStudioOrderAction` archives on completed/cancelled.
- Admin orders page shows enquiry badge, readable options and a 1-hour signed link to the customer photo (admin client).
- **Gallery design picker (2026-09-02).** `art_studio_product_types.gallery_picker_enabled` + `gallery_category_id` (stable gallery category id, `supabase/art-studio-gallery-picker.sql`) map a type to a gallery root category. `src/lib/art-studio-gallery.ts` (server-only) resolves child categories, four designs per page (`getLocalizedGalleryCatalog`, pageSize 4) and the selected design's variants (`getGalleryProductById(id, locale, { revalidate: 60 })`). Public routes `GET /api/art-studio/designs?category=<id>&page=N&locale=` and `GET /api/art-studio/designs/<id>` feed the client picker (`ArtStudioGalleryDesignPicker`, `ArtStudioDesignAvailability`, wrapped with the form in `ArtStudioOrderSidebar`). Reservations from the picker reuse the gallery flow: `processGalleryReservation()` in `gallery/actions.ts` backs both `createGalleryReservationAction` (redirect) and `createGalleryReservationInlineAction` (`useActionState`). The order form sends only `gallery_design_id`; `submitArtStudioEnquiryAction` re-fetches the product and stores `product_snapshot.gallery_design { catalog_id, sku, title, slug, image_url }` plus a `gallery_design` entry in `selected_options`. No gallery data is duplicated in Bansko NOW tables.
- Migration: `supabase/art-studio-enquiry-orders.sql` (applied through the Supabase MCP as `art_studio_enquiry_orders`).

## 27. Photo library and licensing (2026-09-04)

- Tables in `supabase/photo-library.sql` (+ `photo-library-licenses.sql` seed): `photos`, `photo_license_types`, `article_photos`, `photo_import_jobs`, `photo_license_orders`. RLS: anon reads published photos and active license types only; orders and import jobs are never public. Photo codes come from a sequence (`BNK-000001`).
- **Storage split.** Masters stay in Google Drive. Public derivatives (thumb 800, article 1800, preview 2000 with watermark) and private licensed files (web 3000, full resolution) live in Cloudflare R2 under `photos/public/*` and `photos/private/*`. `src/lib/photo-storage.ts` wraps R2 with aws4fetch (upload, delete, presigned PUT for admin uploads, presigned GET for downloads, public URL through `PHOTO_PUBLIC_BASE_URL`). Env: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `PHOTO_PUBLIC_BASE_URL`.
- **Upload path.** Admin browser asks `/api/admin/photos/upload-url` for a presigned PUT, sends the file straight to R2, then calls `/api/admin/photos/process`, which reads the master back, builds the derivatives with sharp (`src/lib/photo-processing.ts`) and inserts the draft row. Vercel's request body limit is therefore never hit.
- **Public pages.** `/photos` (ISR 900, prerendered), `/photos/category/[category]`, `/photos/[slug]` (ISR, newest 100 prerendered). Public reads use `createPublicSupabaseClient()` so the pages stay static; `getPhotoFacets` feeds the filters. `/api/photos` serves the filtered grid and "load more". Photo pages carry ImageObject + BreadcrumbList schema and enter the sitemap with their image.
- **Licensing.** Prices live on `photo_license_types` per tier (`standard` 30/120 EUR, `premium` 50/250 EUR) with optional per-photo overrides; `photoLicensePrice()` is the only source of truth. `/photos/[slug]/license` posts to `createPhotoLicenseCheckoutAction`, which recomputes the price server-side, freezes the license text into the order and creates a Stripe Checkout Session. Fulfilment happens only in `/api/stripe/photo-license` (signature verified, amount compared with the database, idempotent by order status), which emails the buyer a download link. `/api/photo-license/download/[token]` checks the paid order and returns a 30 minute presigned R2 URL for the variant that was bought. Webhook secret: `STRIPE_PHOTO_WEBHOOK_SECRET`, falling back to `STRIPE_WEBHOOK_SECRET`. Both webhook routes accept several signing secrets in one variable (comma or space separated) through `stripeWebhookSecrets()` + `constructStripeEvent()` in `src/lib/stripe.ts`, because Stripe signs test and live events with different secrets; each is tried until one verifies.
- Admin: `/admin/photos` (upload, edit BG/EN texts, location, tags, price tier, Pixsy status, publish, delete). Copyright monitoring is a status field only; no provider integration yet.
- **Editable texts and licenses (2026-09-05).** `/admin/photos/copy` („Текстове и лицензи“) edits every text of `/photos`, the photo pages, the license form and the Stripe line item (BG/EN) plus the photographer's name, and the `photo_license_types` rows (names, summaries, prices, print run limit, order, active flag, full terms; changed terms bump `terms_version`). Defaults and the resolver live in `src/lib/photo-copy.ts` (pure, also used by the client-side article photo picker); overrides are stored in the single-row table `photo_public_settings.page_copy` (`supabase/photo-public-settings.sql`, applied 2026-09-05) and read through `getPhotoArchiveCopy(locale)` in `src/lib/photos.ts`. Only values that differ from the defaults are stored, so a new photographer name flows into the credit, copyright note and checkout description. The photographer is „Любо Канелов“ / "Lubo Kanelov" (the seed had „Лубо Кънелов“; fixed in the database by the migration). Do not re-run `photo-library-licenses.sql` on production: it overwrites admin-edited license texts.
- **Catalog mirror in the request app (2026-09-06).** `src/lib/photo-sync.ts` posts photos to `POST https://app.kanelov.com/api/bansko-now-photos` (Bearer `ART_GALLERY_INTEGRATION_SECRET`, URL derived from the reservation URL, override `ART_GALLERY_PHOTO_SYNC_API_URL`). `updatePhotoAction` syncs the saved photo (published → create/update, unpublished → archive), `deletePhotoAction` archives, `syncAllPhotosAction` (button „Синхронизирай с каталога на заявките“ in `/admin/photos`) sends everything in chunks of 100. The request app keeps one `inventory_catalog` row per photo: SKU = photo code, or the existing product when `photos.catalog_sku` (admin field „SKU в каталога на заявките“, `supabase/photo-catalog-sku.sql`) names it; `image_url` = the public R2 thumbnail, so no file is copied. Rows are never deleted there. Not linked to a kiosk category yet.
- **Bulk metadata.** `GET /api/admin/photos/export` returns a CSV of every editable field (plus read-only `image_url` and `photo_page`), `POST /api/admin/photos/import` writes it back, matching rows by `photo_code`; empty cells are left untouched and nothing is created or deleted. Helpers in `src/lib/photo-csv.ts`, UI in `PhotoCsvTools`. Intended flow: export, let an AI fill in the BG/EN titles, descriptions, alt texts, tags and SEO fields, import.
- Derivatives are built one at a time and uploaded immediately (`createPhotoDerivatives`) to keep the function under the memory and time limits; a failed upload deletes the half made row and records the reason in `photo_import_jobs` (shown at the top of the admin page).

