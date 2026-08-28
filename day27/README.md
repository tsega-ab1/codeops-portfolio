# Day 27 — Props & Rendering Patterns

Module 3 · Frontend: React & Next.js — IBT College Canada, CodeOps Full Stack Software Development program.

## What Today Covered

Going deeper on props — children, defaults, validation — and the rendering patterns every React app relies on: conditional rendering and rendering lists with keys.

## Learning Objectives

- **Master props** — pass any data into components, including the `children` prop, and set sensible defaults
- **Validate props** — document and check a component's expected props with PropTypes
- **Render conditionally** — show, hide, or switch UI with the ternary, `&&`, and early-return patterns
- **Render lists well** — turn arrays into UI with `map`, use stable keys, and combine filtering with rendering

## Agenda

1. Props in Depth
2. Prop Types & Validation
3. Conditional Rendering
4. Lists & Keys

## Key Concepts

- **Props, fully** — pass any value in braces; wrap content with `children`; set defaults in destructuring; spread an object with `{...obj}`
- **PropTypes** — document and check a component's expected props; `.isRequired` for mandatory ones; dev-only, stripped from production
- **Ternary** — `condition ? a : b` renders one of two things
- **Logical `&&`** — `condition && <element>` shows something or nothing; guard numbers with `count > 0 &&` to avoid rendering a `0`
- **Early return** — branch with `if` before the main return to handle loading, empty, and error states
- **Lists & keys** — map data to components; give each a stable id key (not the array index); chain `filter` then `map` for real lists

## In-Class Exercise

Extended the Addis Eats React menu: a `Dish` component with PropTypes and a default, a conditionally rendered spicy badge, a category filter with an empty state, and the list rendered with stable keys.

## Still Static

Everything renders from props passed in — nothing here can change anything itself yet. State (`useState`, Day 28) is what lets the category filter and everything else respond to a click.
