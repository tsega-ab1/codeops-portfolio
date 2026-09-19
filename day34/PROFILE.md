# Profile: Adding a dish to the cart

## Interaction profiled

Navigated to `/menu/doro-wat`, opened the React DevTools Profiler,
started recording, and clicked "Add to cart" once.

## What the profile showed

- Total commit duration: 10.9ms
- Layout: 5.6ms — re-rendered because its own state changed
  (`useCartStore((s) => s.items.length)`, the cart badge count)
- Outlet / DishDetail: <0.1ms — did not re-render at all

## Why DishDetail didn't re-render

DishDetail only reads the `addItem` action from the cart store:

    const addItem = useCartStore((s) => s.addItem);

Zustand actions are stable references that never change between
renders, so selecting only the action (never the whole store, and
never `items`) means DishDetail has nothing to react to when a dish
is added. The narrow-selector discipline from Day 32 is already
preventing the exact problem Day 34 asks you to profile for.

## Conclusion — no fix applied

Per the Day 34 order of steps, the first move is to measure, not to
memoize. Measuring here showed Layout's re-render is correct (its own
state changed) and DishDetail's non-re-render is already correct
(narrow selector). There was no unnecessary re-render to fix, so no
`React.memo` or `useMemo` was added — doing so would have been
unjustified optimisation with nothing to show for it.
