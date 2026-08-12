# Day 18 — Arrays, Objects & Modern JavaScript

## Exercises

- `exercise1.js` — `map` adds 15% VAT, `filter` keeps prices under 1000 ETB, `reduce` sums them.
- `exercise2.js` — a customer object, iterated with `Object.entries()` inside a `for...of` loop.
- `exercise3.js` — one-line destructuring (`{ name, city }`) and a `greet({ name })` function using parameter destructuring.
- `exercise4.js` — spread creates an updated customer copy (new city, added phone) without mutating the original.
- `money.js` / `app.js` — a two-file module split: `money.js` exports `VAT` and `addVat`, `app.js` imports and uses them.

## Mini-Project — TeleBirr Transaction Report

### Module responsibilities

- **`transactions.js`** — owns the data. Exports a single array of transaction
  objects (`{ id, customer, amount, type }`). No logic lives here.
- **`report.js`** — owns the summary logic. Exports three pure functions:
  - `totalByType(txns, type)` — `filter` + `reduce`, totals credits or debits.
  - `buildReceipts(txns)` — `map` with parameter destructuring, builds
    formatted receipt strings.
  - `correctAmount(txn, newAmount)` — `spread`, returns a corrected copy of
    a transaction without mutating the original.
- **`telebirr-app.js`** — owns nothing but wiring. Imports both modules,
  calls the report functions, and prints the results.

### Sample output

```
=== TeleBirr Transaction Report ===

Total credits: 1500 ETB
Total debits: 750 ETB

Receipts:
 - Almaz: 250 ETB (debit)
 - Dawit: 600 ETB (credit)
 - Tigist: 180 ETB (debit)
 - Bereket: 900 ETB (credit)
 - Selam: 320 ETB (debit)

--- Correcting transaction #1 ---
Original (unchanged): { id: 1, customer: 'Almaz', amount: 250, type: 'debit' }
Corrected copy: { id: 1, customer: 'Almaz', amount: 300, type: 'debit' }
```

## Running it

`package.json` sets `"type": "module"` so `export`/`import` syntax works
directly with `node`, no bundler needed.

```bash
node exercise1.js
node exercise2.js
node exercise3.js
node exercise4.js
node app.js
node telebirr-app.js
```

## Self-check

- [x] `filter`, `map`, `reduce` used — no manual counter loops
- [x] `buildReceipts` destructures the transaction object in its callback parameter
- [x] `correctAmount` uses spread; the original transaction is left unchanged
- [x] Logic is split across modules with clear `export`/`import` lines
- [x] Receipt strings use template literals showing customer and ETB amount

