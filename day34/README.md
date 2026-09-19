# Day 33 — Forms & Controlled Components

Module 3 · Frontend: React & Next.js — IBT College Canada, CodeOps Full Stack Software Development program. Week 7.

## What Today Covered

The Addis Eats checkout, built as an interface rather than a set of inputs: mechanics first, then validation rules and their timing, then feedback everyone can perceive.

## Validation Rules and Why They Exist

| Field | Rule | Why |
|---|---|---|
| Name | Must not be empty | The order needs a name for delivery |
| Phone | Must match `0` or `+251` followed by `9` and 8 digits | Ethiopian mobile numbers arrive as `0911…` or `+251911…`; spaces are stripped before testing so formatting never causes a false rejection |
| Area | Must be selected | Delivery cannot be routed without a destination |
| Notes | No rule | Optional by design — nothing to validate |

## The Six States

Every state the reading sheet describes is handled explicitly, not just "typing" and "sent":

- **Pristine** — no errors shown until a field has been visited
- **Dirty** — the person's input kept exactly as typed
- **Invalid** — the specific problem shown beside the field it belongs to
- **Submitting** — the button disables and reads "Sending your order…"
- **Failed** — the reason is shown, and every field keeps its value — nothing is cleared
- **Succeeded** — the cart clears and the person is redirected

## Key Concepts Applied

- One state object for the whole form, one `handleChange` using the updater form (`setForm(f => ...)`) so fast edits never read a stale value
- `validate(form)` is a pure function, called during render so errors are derived and can never disagree with the values
- Errors show only after a field is **touched** (on blur), then update live once a field has been visited — the "after first blur, then live" pattern
- `Field.jsx` wires `htmlFor`/`id`, `aria-invalid`, `aria-describedby`, and `role="alert"` so a screen reader actually announces the problem
- On a failed submit, focus moves to the first invalid field — color is never the only signal
- The `submitting` flag disables the button and prevents a double order from a slow connection or an impatient click
- The ETB total is shown in the submit button label itself, so nobody confirms an order without seeing what it costs
- A simulated request failure keeps every field intact, proving the "never clear the form" rule actually holds

## Files

- `Checkout.jsx` — the form itself
- `validate.js` — the pure validation function, testable with no React involved
- `Field.jsx` — reusable label + input + accessible error wrapper
