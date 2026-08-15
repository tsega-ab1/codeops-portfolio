# Day 20 — Country Facts Page

A single-page app that fetches live country data from the [REST Countries API](https://restcountries.com) and renders it with proper loading, success and error states.

## How to run
Open `index.html` in a browser (or serve the folder with a local dev server). Requires an internet connection.

## API used
`https://restcountries.com/v3.1/name/{country}`

## Features
- Search any country by name; defaults to Ethiopia on first load
- Shows a "Loading…" state while the request is in flight
- Checks `res.ok` and handles both network and HTTP errors with a friendly message
- On failure, a "Retry" button re-runs the last search
- Renders flag, capital, population (comma-formatted), region and currencies
