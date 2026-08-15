# Day 21 — Validated, Persistent Signup Form

A signup form that validates a name and Ethiopian phone number with regex, shows clear errors, and saves valid entries to `localStorage` as JSON — restored on reload.

## How to run
Open `index.html` in a browser.

## Features
- Labelled name and phone inputs, submit button, dedicated error area
- `preventDefault` on submit; input values trimmed before use
- Validation: name ≥ 2 characters; phone matches `/^(?:\+251|0)9\d{8}$/`
- Errors shown with `textContent` (never `innerHTML`)
- Valid entries saved to `localStorage` as JSON array; restored on page load
- `localStorage` reads guarded with try/catch against null or corrupt data
- Signup count displayed and updated on every successful submit
- Bonus: dark mode toggle, preference persisted in `localStorage`

## Also in this folder
- `regex-drills.js` — standalone Node script testing regex patterns for a 4-digit PIN, a TeleBirr amount, and a simple email. Run with `node regex-drills.js`.
