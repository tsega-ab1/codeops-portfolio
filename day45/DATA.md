# Addis Eats Data Architecture

| Data | Where | Key / source | Refresh rule | Why |
| --- | --- | --- | --- | --- |
| Menu page 1 | Server | `searchDishes({ page: 1 })` in `app/menu/page.js` | per request | Public, indexable, in the HTML |
| Dish details | Server | `getDish(id)` | per request | Public; metadata and JSON-LD use the same object |
| Menu search | Client (SWR) | `/api/dishes?q=…&page=…` | on key change | Triggered by typing |
| Search debounce | Client | `useDebounce(search, 300)` | 300 ms | One request per pause |
| Empty search, page 1 | none | SWR key is `null` | — | Server data already shown |
| Pagination | Client (SWR) | `page` is part of the key | on key change | Each page is its own cache entry |
| Order history | Server | `getOrdersFor(session.id)` | per request | Private, scoped to the session |
| Order detail | Server | `getOrderAs(user, id)` | per request | Private; owner or staff |
| Order status | Server first, then client | `/api/orders/[id]/status` + `fallbackData` | every 5 s, stops when delivered/cancelled | No spinner on arrival |
| Kitchen orders | Server | `getKitchenOrdersAs(user)` | revalidated by actions | Staff only |
| Cart | Client | `localStorage` key `cart` | on change | Never leaves the browser until checkout |

`keepPreviousData: true` keeps old results visible while a new search loads.

Server unless the person triggers it: only search, pagination, status polling
and the cart run in the browser.
