# Birr Watch 💱

A simple currency converter and watchlist app for the Ethiopian Birr (ETB), built with vanilla HTML, CSS, and JavaScript as part of Day 22 of the CodeOps Full Stack Software Development program.

## Overview

Birr Watch fetches live exchange rates for ETB and lets you:
- Convert any amount of ETB into a currency of your choice
- Build a personal watchlist of currencies you care about
- Persist your watchlist and last-used currency across sessions

## Features

- **Live exchange rates** — pulls current ETB rates from the [ExchangeRate API](https://open.er-api.com) on load
- **Currency conversion** — enter an amount, pick a currency, and instantly see the converted value
- **Watchlist** — add currencies to a running watchlist showing their live rate against 1 ETB, with a one-click remove button
- **Persistence** — watchlist and selected currency are saved to `localStorage` so they survive a page refresh
- **State → render architecture** — a single `state` object drives all UI updates through a `render()` function, keeping the DOM in sync with data

## How It Works

1. On load, `init()` restores any saved state from `localStorage`, then fetches live rates from the API.
2. The currency `<select>` dropdown is populated dynamically from the fetched rates.
3. Submitting the convert form calculates `amount × rate` and displays the result.
4. Clicking **Add Currency** adds the currently selected currency to the watchlist (no duplicates allowed).
5. Each watchlist item shows its live rate and can be removed individually.
6. Every change to the watchlist or selected currency is saved back to `localStorage`.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+, `async/await`, `fetch`)
- [ExchangeRate API](https://open.er-api.com/v6/latest/ETB) for live rates
- Browser `localStorage` for persistence

## File Structure

```
day22/
├── index.html   # Markup and structure
├── style.css    # Styling
└── app.js       # App logic (state, fetch, render, events)
```

## Running Locally

Since this app uses `fetch`, it should be served over HTTP rather than opened directly as a file:

```bash
npx live-server day22
```

Or open `index.html` through any local static server.

## Possible Improvements

- Handle API failures more gracefully (e.g. retry button)
- Add loading indicators for individual watchlist rate updates
- Support multiple base currencies, not just ETB
- Add input validation feedback directly on the amount field
