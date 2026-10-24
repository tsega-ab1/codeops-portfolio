# Day 48 · Event Handling & Deployment

Module 3 · Frontend: React & Next.js · Week 10
Mini-project: **Harden, Then Ship** (Addis Eats, Next.js 15 App Router)

**Live:** https://codeops-portfolio-alpha.vercel.app


- **No clickable divs.** Audited every handler: each `onClick` is on a real `<button>` and each navigation is a `<Link>`, so keyboard, focus and screen-reader behaviour come for free.
- **Visible focus everywhere.** A global `:focus-visible` ring; nothing removes the outline.
- **Touch targets of at least 44px** for buttons, form fields, nav links and table links. Nothing is hidden behind hover, and buttons give instant press feedback.
- **Checkout is a real form.** `onSubmit` instead of a click handler, so Enter and tap take the same path. The button is disabled while pending, and a ref blocks a second tap before React re-renders.
- **Double submit cannot create two orders.** The client sends an idempotency key (one per checkout attempt, reused on retry). `createOrderAs` returns the original order for a repeated key, and checks again immediately before writing so two simultaneous requests cannot both pass. The key generator has a fallback because `crypto.randomUUID` only exists on HTTPS or localhost, and phone testing over the local network is plain HTTP.
- **Deployed to Vercel** from the `day48` root directory, with a different `SESSION_SECRET` for Preview and Production.
- **`SITE_URL` falls back to Vercel's own URLs** so previews and production never advertise `localhost` or a domain I do not own.

## Pre-flight checklist

| Check | Result |
| --- | --- |
| `npm run build` clean | Pass |
| Every variable listed in `.env.example` | Pass (`SESSION_SECRET`, `SITE_URL`) |
| No secret is public | Pass (no `NEXT_PUBLIC` anywhere) |
| `metadataBase` is the production URL | Pass (after the fallback fix) |
| Remote image hosts allowed | Not applicable, all images are local |
| Import casing matches filenames | Pass |

## Environment variables

| Variable | Development | Preview | Production |
| --- | --- | --- | --- |
| `SESSION_SECRET` | local value in `.env.local` | its own value | a different, strong value |
| `SITE_URL` | `http://localhost:3048` | unset (falls back to the preview URL) | the production domain |

## Keyboard and double-submit checks

- Placed an order using only Tab, Enter and Escape.
- Throttled the network to Slow 3G and tapped Place order repeatedly: exactly one order.
- Went offline, tried to order, came back online and retried: exactly one order.

## Known limitations

- The database is an in-memory object. Vercel runs serverless instances that do not share memory, so orders placed on the live site may not persist, a staff status change may not reach another instance's live stream, and the stream is cut off by function time limits. Sign-in is unaffected because sessions are signed tokens and the seed users are identical everywhere. Real persistence is the next module's topic.
- No page is static: the nav reads the session cookie in the root layout, so every route renders on demand.

## Rolling back

Every deployment stays addressable. In the Vercel dashboard open Deployments, pick the last good one and use **Promote to Production** (or **Instant Rollback**). Restore service first, then find the cause.

## Run it

```bash
cd day48
npm install
cp .env.example .env.local   # fill in SESSION_SECRET and SITE_URL
npm run dev                  # http://localhost:3048
```
