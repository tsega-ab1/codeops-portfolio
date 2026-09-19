# Profile: Adding dishes to the cart

## Before

- Interaction profiled: adding three dishes from the menu, one after another
- Slowest component in the ranked chart: <fill in — e.g. DishList>
- Render duration: <fill in — e.g. 4.2ms>
- Why it rendered: <fill in what the Profiler's "why did this render" panel says>

## The fix

DishList is wrapped in React.memo, and the dish data it receives is
memoized in Menu with useMemo (filtered + derived once per fetch/category
change, not on every render).

## After

- Same interaction, re-profiled
- Slowest component: <fill in>
- Render duration: <fill in>
- Difference: <fill in — did it actually improve, and by how much?>
