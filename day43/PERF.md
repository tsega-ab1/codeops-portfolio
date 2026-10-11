# Addis Eats Performance Report

## Test Environment

- Browser: Chrome (Incognito, extensions off)
- Device:
- Network: Slow 4G (DevTools throttling)
- CPU:
- Build command: `npm run build && npm run start`

## Before Optimization

| Metric | Result |
|---|---:|
| Performance | |
| LCP | |
| CLS | |
| INP | |

## Changes Made

### Images
- Replaced `<img>` with `next/image`
- Added width/height (or `fill` inside an aspect-ratio box)
- Added `sizes`
- Preloaded only the hero image
- Configured `remotePatterns`
- Meaningful `alt` text

### Fonts
- `next/font` with the `latin` subset

### Scripts
- `next/script` with `lazyOnload` for non-critical scripts

### JavaScript
- Kept display-only components as Server Components
- Used `Intl.NumberFormat` instead of a currency library

### Environment
- `.env.example` committed, `.env.local` ignored
- No secret uses `NEXT_PUBLIC_`

## After Optimization

| Metric | Before | After |
|---|---:|---:|
| Performance | | |
| LCP | | |
| CLS | | |
| INP | | |

## Analysis

The largest improvement came from:

The remaining performance problem is:

The next optimization would be:
