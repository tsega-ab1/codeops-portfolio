# Day 26 — React Setup & JSX

A static Addis Eats menu built with React and Vite, as the Day 26 in-class exercise for Module 3 (Frontend: React & Next.js) of the CodeOps Full Stack Software Development program.

## What This Is

This project takes the state → render loop built by hand in Module 2 (Addis Eats, Birr Watch) and rebuilds it the React way: a running Vite + React app that renders a static restaurant menu from components, props, and an array — no interactivity yet, just structure.

## Objectives Covered

- Set up a modern React project with Vite
- Write JSX — markup inside JavaScript, with `{}` expressions and JSX-specific attribute rules
- Build functional components and compose them together
- Pass data into components with props
- Render a list of components from an array using `map` and a stable `key`

## Structure

```
day26/
├── src/
│   ├── App.jsx      # Root component — composes Header + Menu
│   ├── Dish.jsx      # Reusable card component, takes name and price props
│   ├── main.jsx      # Entry point — mounts <App /> into index.html
│   └── index.css
├── index.html         # The one HTML page
├── package.json
└── vite.config.js
```

## Running Locally

```bash
npm create vite@latest day26 -- --template react
cd day26
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`) — the menu updates instantly on save.

## What It Shows

- A `Header` component
- A `Dish` component reused for every item on the menu, taking `name` and `price` as props
- An array of dishes rendered with `menu.map(...)`, each `Dish` given a unique `key`

## Still Static

Nothing here responds to clicks yet — the menu displays data but doesn't change. Interactivity (state, `useState`) starts on Day 27–28.
