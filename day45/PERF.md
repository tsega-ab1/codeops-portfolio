# Addis Eats Performance Decisions

## Budget

Measure on a **production build** (`npm run build && npm start`) or the deployed
site, with Lighthouse mobile throttling. Fill BOTH columns.

| Measure | Target | Before | After |
| --- | --- | --- | --- |
| LCP, throttled | under 2.5 s | | |
| CLS | under 0.1 | | |
| First Load JS, /menu | under 120 kB | | |
| Largest image | under 150 kB | | |
| Lighthouse performance | 90 or better | | |

### How to get an honest "before"

1. Use real dish photos (JPG/WebP) in `public/images` and update `image` in `lib/dishes.js`.
2. Before: `BASELINE=1 npm run build && BASELINE=1 npm start` (turns image optimisation off).
3. After: `npm run build && npm start`.
4. Run Lighthouse on `/menu` each time and record the numbers.

If a number will not come down, write why.

## Decisions in the code

- Server Components fetch the initial menu, dishes and orders.
- Client Components only where the browser is needed: search, cart, polling, forms.
- `next/image` with fixed width/height (prevents layout shift); the first card and dish image use `priority`.
- `next/font` (Inter, `display: swap`) is self-hosted at build time, with no external font request.
- Search is debounced (300 ms) and skipped when empty; polling stops on a final status.
- Secrets stay in `.env.local`; nothing sensitive uses `NEXT_PUBLIC_*`.
- Trade-off: the layout reads the session cookie for the nav, so pages render per request instead of being statically cached.
