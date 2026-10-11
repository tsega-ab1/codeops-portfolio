# Addis Eats — Week 9 integrated project (Day 45)

One Next.js (App Router) application: public menu, cart, sign-in, checkout,
orders with live status, a staff kitchen, measured performance and full SEO.

**Deployed URL:** _add it here after deploying_

## Run

```bash
npm install
cp .env.example .env.local     # then fill SESSION_SECRET (openssl rand -hex 32) and SITE_URL
npm run dev                    # http://localhost:3045
npm run build && npm start     # production check
```

## Demo accounts (password: `addis123`)

| Phone | Name | Role | Owns |
| --- | --- | --- | --- |
| 0911000001 | Almaz | customer | ord_812 |
| 0911000002 | Dawit | customer | ord_790 |
| 0911000010 | Staff Member | staff | — |

## Main flow

Home → Menu → Dish → Add to cart → Cart → (sign in) → Checkout → Place order →
Orders → Order status (polled every 5 s). Staff: Kitchen → update status.

## Verify

- `./attacks.sh` — three attacks plus extra access checks (needs the server running)
- `./check-seo.sh` — titles, canonical, og:image, JSON-LD, sitemap, robots

## Documents

- [AUTH.md](AUTH.md) — layers, routes, actions, attacks
- [DATA.md](DATA.md) — every query, where it runs and why
- [PERF.md](PERF.md) — budget, before and after

## Environment

| Variable | Purpose |
| --- | --- |
| `SESSION_SECRET` | Signs the session cookie. Server only, never `NEXT_PUBLIC_*`. |
| `SITE_URL` | Public origin, used for og:image, sitemap and robots. |

## Data layer

`lib/db.js` and `lib/dishes.js` stand in for the backend API. Orders live in
server memory, so they reset on restart and only work on a single long-running
process (`npm start`). A serverless host (Vercel) runs many instances, so
orders will not persist there. Point those two files at a real API before
relying on a serverless deploy.

## Not used on purpose

No Prisma, PostgreSQL, Docker, OAuth or payment gateway: out of scope for this module.
