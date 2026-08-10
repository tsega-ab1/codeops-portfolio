# Day 16 — JavaScript Foundations

## Files

- `tip.js` — TeleBirr Tip & Split Calculator. Converts a string bill amount
  to a number, applies a tiered tip (10% over 300 ETB, else 5%), adds a
  payment-method service fee via `switch`, then prints total and per-person
  cost using template literals.
- `expected.txt` — the exact console output `tip.js` should produce.
- `fizzbuzz.js` — prints 1–100, replacing multiples of 3 with "Tele",
  multiples of 5 with "Birr", and multiples of both with "TeleBirr".

## Self-check

- [ ] `bill` is converted with `Number()` before any math
- [ ] Tip uses a ternary, not if/else, since it's a one-line either-or
- [ ] Service fee uses `switch` with a `default` case
- [ ] All output uses template literals (no string concatenation with `+`)
- [ ] `node tip.js` output matches `expected.txt` exactly
- [ ] FizzBuzz uses `%` (modulo), checking multiples of 15 first
