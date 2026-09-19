# Day 34 — Error Boundaries, Performance & Lazy Loading

Module 3 · Frontend: React & Next.js — IBT College Canada, CodeOps Full Stack Software Development program. Week 7.

## What Today Covered

Four concerns that separate a working application from a professional one: boundaries so a failure stays local, code splitting so the first screen arrives sooner, profiling so any optimisation is earned, and portals so a modal can escape the card that opened it.

## Key Concepts

### Error Boundaries
- If a component throws during render, React unmounts the **entire** tree by default — an error boundary tells it to keep the rest and replace only the broken region
- `getDerivedStateFromError` renders the fallback; `componentDidCatch` is the side-effect half, where the error gets reported
- Boundaries catch errors during render, in lifecycle methods, and in child components — they do **not** catch errors in event handlers, async code/promises, or in the boundary itself
- Placed at meaningful seams: if the menu fails, the cart and header should still work, so the boundary wraps the menu, not the whole application
- A fallback says what failed and offers an action — a dead-end apology is barely better than a white screen

### Code Splitting & Lazy Loading
- By default every screen ships in one bundle downloaded up front — `lazy()` plus a dynamic `import()` splits a route into its own file, downloaded only the first time it actually renders
- A `Suspense` boundary above a lazy component is required, or it throws while loading
- Worth splitting: routes other than the landing screen, rarely opened modals/panels, heavy libraries. Not worth splitting: the first screen, small components used everywhere, anything under a few kilobytes
- Measure before splitting — splitting a small app achieves nothing

### Performance in Practice
- Profile a slow interaction, find the longest bar in the ranked chart, ask *why* it rendered, fix the cause, then measure again
- Reasons a component re-renders: its own state changed (correct, nothing to do), its parent re-rendered (React.memo or move state down), a prop is a new object each render (`useMemo`), a handler is recreated each render (`useCallback` + memoised child), or the context value changed (split the context or use a store)
- Order of steps: measure → move state down → split context / narrow store selectors → memoise the specific value → `React.memo` the child → virtualise/paginate if genuinely large
- If a memo made no measurable difference, take it out — unjustified optimisation is code someone else has to maintain forever

### Portals
- A modal inside a card with `overflow: hidden` gets clipped — CSS can't fix it, since the problem is *where* the element lives in the DOM
- `createPortal(children, domNode)` renders content into a different DOM node while keeping it a child in the **React** tree — it still reads the same context, and its events still bubble to its React parent, not the DOM node it landed in
- A usable modal needs: focus moved in on open, focus trapped inside while open, Escape to close, focus returned to the trigger on close, and `role="dialog"` with a label

## What Was Built

- `ErrorBoundary.jsx` — the class component, with `MenuUnavailable`, `CartUnavailable`, and `AppCrashed` as fallbacks at different seams (menu, cart, whole app)
- A deliberate crash button on the dish detail page, confirming the menu boundary catches it while the header and cart keep working
- `Checkout.jsx` and `Receipt.jsx` lazy-loaded behind a `Suspense` skeleton, verified in the Network tab under throttling
- `Modal.jsx` — a portal-based quick-view modal with Escape-to-close, a small focus trap, and focus returned to the trigger on close
- `PROFILE.md` — a real Profiler recording of adding a dish to the cart

## Profiling Result

Profiled adding a dish to the cart. Layout re-rendered (5.6ms) correctly, since its own state changed (the cart badge count). DishDetail did not re-render at all — it selects only the `addItem` action from the Zustand store, which is a stable reference. **No fix was applied**, since the narrow-selector discipline from Day 32 already prevents the unnecessary re-render the profiling was meant to catch. Full detail in `PROFILE.md`.
