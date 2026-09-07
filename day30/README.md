# Day 30 — Hooks Deep Dive

Module 3 · Frontend: React & Next.js — IBT College Canada, CodeOps Full Stack Software Development program. End of Week 1.

## What Today Covered

The remaining hooks — `useContext`, `useReducer`, `useMemo`, `useCallback` — and how to package your own logic into custom hooks. The Week 1 project assembles everything from Days 26–30 into one working Addis Eats application.

## Key Concepts

### useContext
- Threading a prop through layers that don't use it is **prop drilling**; context is the way out — a parent publishes a value, any descendant reads it directly
- Three steps: `createContext`, wrap with `<Context.Provider value={...}>`, read with `useContext(Context)`
- Context is a **channel, not a store** — the state still lives in a component using `useState` or `useReducer`
- `useContext` walks up the tree and takes the value from the nearest matching Provider
- Good fit: current user, theme/language/currency, the shopping cart, feature flags
- Poor fit: a value used in only one place, data changing many times a second, anything a prop already passes cleanly
- Every consumer re-renders when the context value changes — wrap the value in `useMemo` so a fresh object literal doesn't cause that on every render

### useReducer
- When several state values change together, or the next value depends on the last, separate `useState` calls start to drift apart
- A reducer is a **pure function**: current state plus an action describing what happened, returning the next state — it never mutates, fetches, or touches anything outside itself
- Because it's pure, it can be tested directly with plain objects and no React at all
- `useState`: one independent value, simple set operations, logic in the handler
- `useReducer`: several values that change together, next state depends on the last, logic in one pure function
- A reducer for the cart plus context to distribute it is the standard pairing — close to how Redux works underneath

### useMemo & useCallback
- Every render recreates every value and function inside a component; React compares props by **reference**, so a recreated array or handler looks like a change even when nothing meaningful differs
- `useMemo` remembers a **value** — recalculates only when the dependencies change, same dependency-array rules as `useEffect`
- `useCallback` remembers a **function** — `useCallback(fn, deps)` is `useMemo(() => fn, deps)` with nicer syntax
- On its own, `useCallback` changes nothing — it only helps when the child is wrapped in `React.memo`, or the function appears in a dependency array
- Three real reasons to reach for either: a genuinely expensive calculation, a prop feeding `React.memo`, or a value inside a dependency array — otherwise, moving state closer to where it's used usually beats memoising

### Custom Hooks
- A custom hook is a function whose name begins with `use` and that calls other hooks — how you share **stateful logic** between components
- Hooks only work inside components, so logic calling `useState`/`useEffect` can't be extracted into an ordinary helper — custom hooks fill that gap
- Rules: name must start with `use`; call hooks at the top level only; call only from components or hooks; state is not shared between callers — each call gets its own independent copy
- Logic is shared, data is not: two components calling the same custom hook get entirely separate state

## Week 1 Project: Addis Eats, Assembled

One React application bringing together Days 26–30:

- A `useFetch` custom hook returning `data`, `loading`, `error`, with cleanup that aborts the request
- A pure `cartReducer` handling add, remove, and clear, in its own file
- A `CartProvider` using `useReducer`, providing items, dispatch, and the derived total in ETB
- A header cart badge and a checkout panel that both read the cart with `useContext` — no prop drilling
- A category filter driving the fetch, with all three states (loading/error/data) visible on screen
- The provider value memoised with `useMemo`, plus a `useCallback` justified by a `React.memo`-wrapped dish list
