# Day 29 — Side Effects: useEffect & useRef

Module 3 · Frontend: React & Next.js — IBT College Canada, CodeOps Full Stack Software Development program.

## What Today Covered

Components learn to reach outside themselves. Today revises what a side effect is, how the dependency array and cleanup control an effect's lifecycle, how to fetch data properly, and what `useRef` is for. The Addis Eats menu stops being a hard-coded array and starts arriving from a server.

## Key Concepts

### Effects & useEffect
- Rendering is supposed to be **pure** — props and state go in, JSX comes out, nothing outside the component is touched
- Anything that breaks that rule — a network request, a timer, setting `document.title`, reading/writing `localStorage`, subscribing to an event — is a **side effect**, and belongs in `useEffect`
- `useEffect` takes two arguments: the function to run, and the array of values it depends on
- React runs the function *after* the browser has painted, and re-runs it only when something in the dependency array has changed
- An effect with no dependency array runs after every render; if it also sets state, that causes another render, which runs the effect again — an infinite loop. React Strict Mode runs effects twice in development to surface this early
- If a value can be calculated from props and state during render, calculate it — don't put it in an effect. An effect that only turns data into other data adds an extra render and a value that can go stale

### Dependencies & Cleanup
- The dependency array decides **how often** an effect runs; the function the effect returns decides **how it tidies up**
- `[]` → runs once, after the first render only
- `[category]` → runs after the first render, then whenever `category` changes
- omitted → runs after every single render — rarely what you want
- Every prop, state value, or variable the effect reads belongs in the array — leaving one out gives a **stale closure**
- If an effect returns a function, React calls it before running the effect again, and once more when the component is removed — whatever the effect started, cleanup stops
- A forgotten interval or event listener keeps running after the component is gone — leaks are silent, nothing throws

### Common mistakes
- Missing a dependency the effect actually reads
- An object recreated each render in the dependency array — never equal, so the effect runs on every render
- Passing an `async` function directly to `useEffect` — it returns a promise, not a cleanup function. Fix: declare an async function inside the effect and call it
- Forgetting cleanup — a listener that outlives the component

### Data Fetching
- Real fetching means three states on screen: **loading**, **error**, and **data** — the early-return pattern picks the right one
- `fetch` does not reject on a 404 or 500 — only a network failure rejects. You must check `res.ok` yourself and throw, or the error branch never runs
- Order matters with early returns: each guard means the code below it can assume the happy case
- An empty result is a *normal* outcome, not a failure — keep it out of the error branch
- Putting `category` in the dependency array refetches whenever it changes
- Cancel the previous request in cleanup with `AbortController`, or a slow earlier response can land last and overwrite newer data

### useRef
- `useRef` returns an object with one property, `.current` — React keeps that object identical across every render, but changing what's inside never causes a render
- It's a box that survives renders and that React otherwise ignores
- Passing a ref to a JSX element puts the real DOM node into `.current` once it's on screen — that's why DOM work goes in an effect, since before the paint, `.current` is still `null`
- If a value appears on screen it must be state, not a ref — a ref changing never triggers a render, so anything shown to the user would silently go stale
- Refs are for bookkeeping the user never sees, and for real DOM nodes (focus, scroll, measure)

## Mini-Project: The Menu That Loads Itself

Turned the interactive Day 28 menu into one that fetches its own data:

- Dishes loaded in `useEffect` and stored in state — no hard-coded array left in the component
- Separate `loading` and `error` state, each rendered with an early return
- `res.ok` checked, with a message the user can actually understand
- `setLoading(false)` in a `finally` block so a spinner can never get stuck
- `category` in the dependency array, so changing it refetches
- `AbortController` cancellation in cleanup
- A search input focused on mount with `useRef`
