# Day 32 — Context API & State Management

Module 3 · Frontend: React & Next.js — IBT College Canada, CodeOps Full Stack Software Development program. Week 7.

## What Today Covered

The context patterns worth knowing, what a state library actually adds, Zustand as the tool to build with, and enough Redux Toolkit to read it confidently in an existing codebase. The Addis Eats cart moves out of a provider and into a store — and almost nothing in the screens has to change.

## Why the cart is in a store and the session is not

The **cart** changes on nearly every click, is read by the header badge, the dish page, the cart page and checkout, and needs to survive a refresh. That is a busy, widely-read, persisted slice — exactly what a store is for. Living outside the component tree means it survives navigation because of where it lives, not because a provider happens to stay mounted, and the `persist` middleware gives durability in one line.

The **session** is a single value that changes twice in a visit — sign in, sign out. It is read by the route guard and the login screen and nothing else. Context already answers that well, and a store would add a dependency for no benefit. The rule: reach for a store when there are many slices, frequent updates, or a real need for persistence; otherwise context is enough.

## Key Concepts

### Context in Depth
- Wrap each context in its own guarded hook — without the guard, forgetting the provider gives `null` and a crash somewhere unrelated; the hook fails immediately and says exactly what is wrong
- Export the hook and keep the context object private to the module
- Split contexts by how often they change — one context holding user, cart, theme and language ties them together, so the rare value pays the cost of the busy one
- Splitting state from dispatch is another useful division: dispatch never changes, so write-only components never re-render when the data does

### Zustand
- A store in one `create` call, with no provider to mount — `create` takes a function receiving `set` and returning the initial state; actions live in the same object
- `set` merges rather than replaces, so `set({ items: [] })` leaves other keys untouched; pass a function when the new value depends on the old
- Because the store is a module, any component imports it directly — nothing has to be mounted above, and moving a component in the tree cannot break its access
- **Selectors are the entire benefit** — `useCartStore((s) => s.items)` re-renders only when items change; a bare `useCartStore()` takes the whole store and behaves exactly like context
- A component selecting only an action never re-renders at all
- Returning a fresh object from a selector defeats the comparison Zustand uses, so it always looks changed — prefer one selector per value
- The `persist` middleware stores the slice under a named key so it survives a refresh

### Redux Toolkit (read, don't build)
- `createSlice` takes initial state and reducers, and generates the action creators
- Writing `state.items.push(...)` looks like mutation, but Immer records changes against a draft and produces a new object — this applies only inside a slice; everywhere else the no-mutation rule still holds
- `configureStore`, a `<Provider store={store}>`, then `useSelector` and `useDispatch` in components
- `useSelector` is the selector from Zustand, `dispatch` is dispatch from a reducer, and Provider is the context provider — every idea is one already learned

### Choosing well
- Start with `useState` — most state belongs in the component using it
- Lift to **context** when a few values are shared widely and change on user actions
- Reach for a **store** when there are many slices, frequent updates, or a real need for devtools and persistence
- Keep **server data** out of all three — putting fetched data in a global store means owning caching, refetching and staleness by hand

## Mini-Project: The Cart, Moved to a Store

- Guarded `useAuth` and `useTheme` hooks that throw an actionable error outside their provider
- Separate `AuthProvider` and `ThemeProvider`, no longer bundled into one value
- A Zustand cart store with `items`, `addItem`, `remove` and `clear`
- Every consumer reading through a narrow selector — no bare `useCartStore()` calls anywhere
- The `persist` middleware configured under `addis-eats-cart`, with the order restored on reload
- `CartProvider`, the reducer file, and the `useMemo` on the provider value all deleted
