# Day 47 · Maps, Real-Time & Data Formats

Module 3 · Frontend: React & Next.js · Week 10
Mini-project: **Tracking a Delivery** (Addis Eats, Next.js 15 App Router, JavaScript)

## What I built

- **Delivery map** with Leaflet, loaded by `components/MapPanel.js` using `dynamic(..., { ssr: false })` and a placeholder of exactly 320px so the page does not jump. `DeliveryMap.js` imports the Leaflet stylesheet, keeps the OpenStreetMap attribution, shows the kitchen, courier and address as pins, and fits the view with `fitBounds`.
- **Same information as text** beside the map (address, area, courier stage, ETA) for people who cannot use a map.
- **Live status over server-sent events**: `app/api/orders/[id]/stream/route.js` frames each message as `data: ...` plus two newlines, encodes it as bytes, sends a keep-alive comment, and closes itself when the order is delivered or cancelled or the client disconnects.
- **`components/OrderStatus.js`** is seeded from the server render, opens an `EventSource`, closes it on unmount and on a final status, shows a connection indicator (connecting, live, reconnecting, offline, final), and falls back to polling the status route if the stream fails.
- **`lib/format.js`** exports `etb`, `formatETB`, `when` and `relative`, each built once, always naming both locale (`en-ET`) and time zone (`Africa/Addis_Ababa`).
- **CSV export** (`lib/csv.mjs` and `components/ExportOrdersButton.js`) quotes commas, quotes and newlines, adds a BOM for Excel, and revokes the object URL after download. `scripts/csv-test.mjs` checks the awkward cases.

## Decisions

- Tracking lives on the existing `/orders/[id]` page rather than a new `/track` route, so customers keep the URL they already use.
- Orders gained a `delivery` object. The courier position is derived from the order status, since there is no real GPS feed.
- Polling (Day 41) stays as the fallback. SSE is the primary path because updates are frequent and one-directional.
- WebSockets were not needed: the client never sends data over the connection, and serverless hosting does not hold sockets open.

## Checks

- [x] `npm run build` succeeds and Leaflet is split out of the order page bundle
- [x] Map appears without the page jumping
- [x] Navigating away closes the stream (no open connections left in DevTools)
- [x] Every price and time goes through `lib/format.js`
- [x] CSV survives a value with a comma and a quotation mark (`node scripts/csv-test.mjs`)
- [x] Delivery information is available as text, not only on the map

## Notes

- Leaflet takes `[lat, lng]`; GeoJSON uses `[lng, lat]`.
- The public OpenStreetMap tile server is fine for coursework, not for production traffic.
- Needs `.env.local` with `SESSION_SECRET` and `SITE_URL` (see `.env.example`).

## Run it

```bash
cd day47
npm install
cp .env.example .env.local   # then fill in both values
npm run dev                  # http://localhost:3047
```
