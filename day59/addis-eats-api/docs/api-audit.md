# API audit - Day 57

The Day 56 route surface (16 routes) checked against the nine naming rules.

## Result by rule
| # | Rule | Result |
|---|---|---|
| 1 | Nouns, never verbs | Pass. Every segment is a noun: orders, restaurants, dishes, status |
| 2 | Plural for collections | Pass |
| 3 | Lower case, hyphenated | Pass. Every segment is a single lower-case word |
| 4 | The id identifies, nothing else | Pass. Only `/orders/:id`, `/dishes/:id`, `/restaurants/:id` |
| 5 | Nest to show belonging | Pass. `/restaurants/:id/dishes` and `/restaurants/:id/orders` |
| 6 | No file extensions | Pass |
| 7 | No trailing slash | Pass. None is published |
| 8 | Filters go in the query | **Fail, twice.** `/restaurants/open` and `/orders/pending` |
| 9 | Two levels at most | Pass. The deepest is `/restaurants/:id/dishes/:dishId` |

## Renames (one sentence each)
1. `GET /restaurants/open` became `GET /restaurants?isOpen=true`, because "open" is a filter wearing a path, and in the query string it also combines with `?area=` and with paging for free.
2. `GET /orders/pending` became `GET /orders?status=PENDING`, because a path per status would need `/orders/delivered`, `/orders/cancelled` and a new route for every future status, while `?status=` handles all of them.

## Kept on purpose
- `PATCH /orders/:id/status` stays: it is a named part of one member that changes on its own, and the transition will have rules that a general PATCH would not enforce (Day 58).
- `GET /dishes?restaurantId=1` and `GET /restaurants/1/dishes` both stay: the first means "dishes in general, filtered", the second means "the dishes that only make sense inside one restaurant".

## Consequence
Both routes are gone, so `/api/v1/orders/pending` now falls through to `/api/v1/orders/:id`, and `ParseIntPipe` answers 400. The API is one row shorter per rename in the startup log.
