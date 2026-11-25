# Expected answers

`bash run-all.sh` sends every request below and checks four things for each one:
the status code, the message, the five error fields, and that no stack trace appears.

Order 5 is seeded as DELIVERED. Restaurant 3 is seeded as closed. Dish 3 belongs to restaurant 2.

| # | Body file | Request | Code | Message contains |
|---|---|---|---|---|
| 00 | bad-requests/00-control-valid-order.json | POST /orders | 201 | totalSantim |
| 01 | bad-requests/01-phone-wrong-prefix.json | POST /orders | 400 | phone must be a TeleBirr number |
| 02 | bad-requests/02-phone-too-long.json | POST /orders | 400 | phone must be a TeleBirr number |
| 03 | bad-requests/03-lines-empty.json | POST /orders | 400 | lines should not be empty |
| 04 | bad-requests/04-line-missing-dishid.json | POST /orders | 400 | lines.0.dishId |
| 05 | bad-requests/05-quantity-too-big.json | POST /orders | 400 | lines.0.quantity must not be greater than 20 |
| 06 | bad-requests/06-unknown-field.json | POST /orders | 400 | property isAdmin should not exist |
| 07 | bad-requests/07-client-sent-total.json | POST /orders | 400 | property totalSantim should not exist |
| 08 | bad-requests/08-telebirr-needs-phone.json | POST /orders | 400 | phone is required when paymentMethod is TELEBIRR |
| 09 | bad-requests/09-restaurant-missing.json | POST /orders | 404 | Restaurant 99 was not found |
| 10 | bad-requests/10-restaurant-closed.json | POST /orders | 409 | Restaurant 3 is closed |
| 11 | bad-requests/11-dish-on-other-menu.json | POST /orders | 422 | is not on the menu of restaurant 1 |
| 12 | bad-requests/12-delivered-to-pending.json | PATCH /orders/5/status | 409 | An order cannot go from DELIVERED to PENDING |
| x1 | - | GET /orders/99999 | 404 | Order 99999 was not found |
| x2 | - | GET /orders/boom | 400 | numeric string is expected |
| x3 | bad-requests/x3-dish-price-with-decimals.json | POST /dishes | 400 | whole number of santim |

Row 00 is a control (a valid order, so a pass there proves the validators are not rejecting good input).
Rows 01 to 12 are the twelve bad requests. Rows x1 to x3 are extra checks.
