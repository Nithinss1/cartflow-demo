---
name: qa-api
description: >
  QA tests for the Brightwell Goods JSON API in server.js (/api/products, /api/discount,
  /api/orders) and the pricing logic in src/. Exercises real HTTP requests with curl
  against a local server started from the PR branch.
---

# QA: JSON API (api)

This app is tested with `curl` and `jq` only. No browser and no droid-control driver are needed.

## Testing Target

1. From the repo root, start the server in the background: `PORT=3000 npm start > qa-results/$RUN_ID/server.log 2>&1 &`. Use another port if 3000 is busy.
2. Poll `curl -sf http://localhost:3000/api/products` until it returns 200 (up to 30 seconds).
3. Use `http://localhost:3000` (or the chosen port) as `BASE`.
4. Never test a remote URL. If the server does not start, report every API flow as BLOCKED with the tail of `server.log`.

If the web app is also being tested in this run, reuse the same server.

## Authentication

None. No headers or secrets are required.

## Request Pattern

Capture status and body together for every check:

```bash
curl -sS -o /tmp/body.json -w '%{http_code}\n' -X POST "$BASE/api/orders" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"id":"keyboard","quantity":1}],"discountCode":"SAVE10"}'
jq . /tmp/body.json
```

Request bodies use `{ "items": [{ "id": "<product id>", "quantity": <int> }], "discountCode": "<code>" }`. Product ids: `headphones` ($25), `speaker` ($40), `keyboard` ($89), `mouse` ($32), `watch` ($120), `camera` ($75).

## File-to-Flow Map

| Changed file | Flows to run |
| --- | --- |
| `src/catalog.js` | A1, A5 |
| `src/checkout.js` | A2, A4, A5, A6, A7 |
| `src/orders.js` | A5, A6, A7, A8 |
| `server.js` | A1, A2, A3, A5, A8, A9 |

## Flow Menu (guest persona)

### A1. List products

- `GET /api/products`. Success: 200, `products` has 6 entries, each with `id`, `name`, `price` (number).

### A2. Valid fixed discount codes

- `POST /api/discount {"code":"SAVE10"}`. Success: 200 `{"code":"SAVE10","discount":10}` (extra fields allowed).
- `POST /api/discount {"code":"  save25 "}`. Success: 200 with `code` `SAVE25` (trimmed and uppercased).

### A3. Invalid discount codes (negative)

- `{"code":"BOGUS"}` and `{}`. Success: 404 with `error` "That discount code is not valid".
- A malformed body such as `{"code":` returns 400 `{"error":"Invalid JSON"}`.

### A4. Percentage discount codes

- `POST /api/discount {"code":"WELCOME15"}` and `{"code":"VIP20"}`.
- Success: 2xx, `code` echoed, `percent: true`, and `discount` is a number (not `null`). A 404 for a documented code is a FAIL.

### A5. Place an order

- `POST /api/orders` with keyboard x1 and `SAVE10`. Success: 201, `orderId` matches `BW-\d+`, `subtotal` 89, `discount` 10, `total` 79, items priced from the catalog.
- Without a code: keyboard x1 plus speaker x1 gives `total` 129.

### A6. Discount larger than the subtotal (boundary)

- headphones x1 with `SAVE30`. Success: 201 and `total` 0. A negative `total` is a FAIL. Note the returned `discount` value in the report.

### A7. Percentage order totals

- keyboard x1 with `WELCOME15`. Success: 201, `discount` 13.35, `total` 75.65.
- keyboard x2 with `VIP20`. Success: `discount` 35.6, `total` 142.4.
- `discount` of `null`, a negative total, or a total that does not equal `subtotal - discount` is a FAIL.

### A8. Order error handling (negative)

- Empty cart `{"items":[]}`, unknown product `{"items":[{"id":"nope","quantity":1}]}`, and bad quantity `{"items":[{"id":"keyboard","quantity":0}]}`.
- Success: a non-2xx status with a JSON `error` message, and the server keeps serving requests afterwards.
- The legacy payload `{"items":[{"productId":"keyboard","quantity":1}]}` must not create an order.
- Record the actual status codes. A 500 for client mistakes is worth noting in the report as a known gap; it is a FAIL only if the diff touched error handling.

### A9. Static files and unknown routes

- `GET /`, `/app.js`, `/styles.css`. Success: 200 with `text/html`, `application/javascript`, and `text/css` content types.
- `GET /nope` and `DELETE /api/products`. Success: 404.

## Evidence

Embed each request and its trimmed response (status plus JSON) as a labeled fenced code block in the report's evidence section.

## Known Failure Modes

1. **Server not running.** `curl: (7) Failed to connect`. Check `qa-results/$RUN_ID/server.log` and report BLOCKED if it did not start.
2. **Port already in use.** `EADDRINUSE` in the log. Use another port.
3. **Client errors return 500.** `server.js` maps every `createOrder` exception to HTTP 500 with "We couldn't place your order. Please try again." Treat this as the current baseline unless the diff changes error handling.
4. **Order numbers reset on restart.** Match `BW-\d+`, not a fixed number.
5. **Floating-point totals.** Compare money values rounded to cents.
