# Day 44 — Metadata, Social Sharing & SEO (Addis Eats)

Run: `npm install && npm run dev` (port 3044), then `./verify.sh`.

## What exists
- Root layout: metadataBase, title template (`%s · Addis Eats`), default title/description
- Static metadata + canonical on `/` and `/menu`
- `/menu/[id]`: generateMetadata, canonical, Open Graph, MenuItem JSON-LD, notFound()
- Site-wide and per-dish OG images (ImageResponse, 1200x630)
- sitemap.js built from dishes (private routes excluded), robots.js (/cart, /checkout disallowed)
- /cart and /checkout also set `robots: noindex`

## Notes
- `params` is a Promise in current Next.js: `const { id } = await params`
- robots.txt is crawl guidance, not security. Auth protects private pages.
- JSON-LD is escaped (`<` → `\u003c`) before injection.
- OG image import path from `[id]/opengraph-image.js` is `../../lib/dishes`.
- `metadataBase` is the production domain, so og:image URLs show addiseats.et even on localhost.
