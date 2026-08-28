# Day 27 — Props & Rendering Patterns

Extends the Day 26 Addis Eats menu with prop validation, defaults, conditional rendering, and a filtered list — the Day 27 in-class exercise for Module 3 of the CodeOps Full Stack Software Development program.

## What Was Added

- **PropTypes** on `Dish` and `Menu` — `name`/`price` required, `spicy` optional, with a `currency` default of `"ETB"`
- **Conditional rendering** — a 🌶 Spicy badge shown with `&&` only when `spicy` is true
- **`Card` wrapper component** — renders whatever is passed as `children`, used to give every `Dish` the same shell
- **Category filter with empty state** — `Menu` filters dishes by `category`, showing `"No {category} dishes."` when nothing matches
- **Filter-then-map** — the filtered list is rendered with `map`, each `Dish` keyed by its stable `id` (never the array index)

## Structure

```
day27/
├── src/
│   ├── App.jsx    # Composes Menu with a hard-coded category
│   ├── Menu.jsx   # Filter by category, empty state, map with keys
│   ├── Dish.jsx   # Props + default + PropTypes + conditional badge
│   ├── Card.jsx   # Wrapper component using the children prop
│   └── data.js    # Menu array: id, name, price, category, spicy
```

## Running Locally

Drop these files into a Vite React project (e.g. the one from Day 26):

```bash
npm install prop-types
npm run dev
```

Check the browser console for PropTypes warnings — there should be none.

## Still Static

Everything renders from props and a hard-coded category — nothing responds to a click yet. State and `useState` land on Day 28, making the category filter (and everything else) interactive.
