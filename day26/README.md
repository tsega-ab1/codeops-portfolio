# Day 26 — React Setup & JSX

Module 3 · Frontend: React & Next.js — IBT College Canada, CodeOps Full Stack Software Development program.

## What Today Covered

React automates the state → render loop built by hand in Module 2. Today's focus: setting up a modern React project with Vite, and learning JSX — the syntax that makes React feel like HTML with superpowers.

## Learning Objectives

- **Understand React** — what it is, why it exists, and how it automates the state → render loop
- **Set up with Vite** — create, run, and understand the structure of a modern React project
- **Write JSX** — read and write markup inside JavaScript, including expressions, attributes, and its rules
- **Build components** — create functional components, render them, and compose them together

## Agenda

1. Project Setup with Vite
2. JSX Fundamentals
3. Functional Components & Rendering
4. Component Composition

## Key Concepts

| Module 2 (by hand) | React |
|---|---|
| `state = { ... }` object | `useState` (soon) |
| call `render()` yourself | automatic re-render |
| `innerHTML` + strings | JSX |
| `addEventListener` | `onClick` props |
| `querySelector` everywhere | declarative UI |

- **Vite** — fast modern build tool; `npm create vite`, `npm install`, `npm run dev`
- **JSX** — markup inside JavaScript; `{}` runs JavaScript expressions; one root element per return
- **Components** — capitalized functions that return JSX; the UI is described, not manually rendered
- **Composition** — components nest inside components; lists are rendered with `map` and a `key`

## In-Class Exercise

A running Vite + React project that renders a static Addis Eats menu: a `Header` component and a reusable `Dish` component, with the menu rendered from an array using `map` and keys.

## Still Missing

Everything is static — it displays data but does not respond to clicks. State (Day 27–28) is what makes it interactive.
