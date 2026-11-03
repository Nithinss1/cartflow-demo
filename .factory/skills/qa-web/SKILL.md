---
name: qa-web
description: >
  QA tests for the Brightwell Goods storefront web app (public/ served by server.js).
  Drives the real storefront in a browser as a guest shopper: catalog, bag, promo codes,
  checkout, and order confirmation.
---

# QA: Storefront (web)

Use the `droid-control` skill for all browser interactions. Route the target as a web page (its **browser-use** atom) and use its Capture and Verify stages. Load Compose only when both `video_evidence` and `droid_control.compose` are true in `.factory/skills/qa/config.yaml`. This file describes WHAT to test and the success criteria; droid-control owns HOW to drive the browser.

## Testing Target

This project has no preview or remote deployments. Always test the PR branch's own code on a local server:

1. From the repo root, start the server in the background: `PORT=3000 npm start > qa-results/$RUN_ID/server.log 2>&1 &`. Use another port if 3000 is busy.
2. Poll `curl -sf http://localhost:3000/api/products` until it returns 200 (up to 30 seconds). The log prints `Brightwell Goods running at http://localhost:3000` when ready.
3. Use `http://localhost:3000` (or the chosen port) as the base URL.
4. Never fall back to any remote URL. If the server does not start, report every web flow as BLOCKED with the tail of `server.log`.
5. Restart the server between flows only when a clean state is needed; order numbers restart at `BW-1001` on every start.

## Authentication

None. The storefront has no login and needs no secrets. The only persona is `guest`.

## Page Map

- Header: brand "Brightwell Goods" and a "Bag" pill with the item count (`#cart-count`).
- Product grid (`#products`): 6 cards, each with name, variant, price, and an "Add to bag" button.
- Bag panel (`#cart`): heading "Your bag" with `N item(s)`, line items with "−" ("Remove one") and "+" ("Add one") buttons, an empty message "Your bag is empty. Add a product to get started.", a discount form (input placeholder "Enter promo code", "Apply" button), Subtotal, Discount, Shipping "Free", "Total due", a status notice (`#notice`, `aria-live`), and the "Checkout →" button.
- Confirmation (`#confirmation`, hidden until an order succeeds): "Order placed!", order number `BW-<digits>`, "Total charged: $X.XX", and a "Continue shopping" button.

Catalog prices: Wireless Headphones $25, Portable Speaker $40, Mechanical Keyboard $89, Ergonomic Mouse $32, Fitness Watch $120, Instant Camera $75.

Codes in the README: fixed `SAVE10` ($10), `SAVE25` ($25), `SAVE30` ($30); percentage `WELCOME15` (15%), `VIP20` (20%). Codes are case-insensitive and trimmed.

## File-to-Flow Map

| Changed file | Flows to run |
| --- | --- |
| `public/index.html`, `public/styles.css` | W1, W2, W7 (plus any element the diff touched) |
| `public/app.js` | W2, W3, W4, W7; add W5 or W6 if discount rendering changed |
| `src/catalog.js` | W1, W2, W7 |
| `src/checkout.js` | W3, W5, W6, W7 |
| `src/orders.js` | W7, W5 |
| `server.js` | W1, W3, W4, W7 |

## Flow Menu (guest persona)

Pick only the flows relevant to the diff, plus adjacent integration checks.

### W1. Catalog renders

1. Open the base URL.
2. Success: exactly 6 product cards with the names and prices listed above; the bag shows "0 items", the empty message, and a disabled "Checkout →" button.

### W2. Bag management (includes the empty-bag negative test)

1. Add Mechanical Keyboard. Success: notice "Mechanical Keyboard added to your bag.", bag pill 1, "1 item", Subtotal $89.00.
2. Click "+" on that line. Success: quantity 2, "2 items", Subtotal $178.00.
3. Click "−" twice. Success: line removed, empty message visible, Subtotal $0.00.
4. Negative: with an empty bag, "Checkout →" is disabled and clicking it does nothing.

### W3. Fixed discount code

1. Add Mechanical Keyboard, type `save10` (lowercase), click Apply.
2. Success: notice "Discount SAVE10 applied.", Discount −$10.00, Total due $79.00.

### W4. Invalid discount code (negative)

1. Add any product, type `BOGUS`, click Apply.
2. Success: error notice "That discount code is not valid" (error styling), Discount −$0.00, totals unchanged.

### W5. Discount larger than the subtotal (boundary)

1. Add Wireless Headphones ($25), apply `SAVE30`, then check out.
2. Success: before checkout, Discount −$25.00 and Total due $0.00. After checkout, the confirmation shows "Total charged: $0.00". A negative amount anywhere (for example `$-5.00`) is a FAIL.

### W6. Percentage discount codes

1. Add Mechanical Keyboard ($89), apply `WELCOME15`.
2. Success: the code is accepted ("Discount WELCOME15 applied."), Discount −$13.35, Total due $75.65.
3. Click "+" (subtotal $178.00). Success: the discount recalculates to −$26.70 and Total due is $151.30.
4. Check out. Success: "Total charged" equals the Total due shown in the bag.
5. Repeat with `VIP20` on one keyboard: Discount −$17.80, Total due $71.20.
6. A rejected code, a discount that does not scale with the subtotal, or a charged total that differs from the bag total is a FAIL.

### W7. Checkout happy path and confirmation

1. Add Mechanical Keyboard and Portable Speaker, apply `SAVE10`, note Total due ($119.00), click "Checkout →".
2. Success: notice "Placing your order..." then the confirmation panel with "Order placed!", an order number matching `BW-\d+`, and "Total charged: $119.00".
3. Click "Continue shopping". Success: the bag view returns, empty, with the discount input cleared and "0 items".
4. An error notice such as "We couldn't place your order. Please try again." is a FAIL; include the `server.log` tail.

## Evidence

- After each success check, capture the accessibility tree of the bag panel or confirmation panel through droid-control and embed it as a labeled text snapshot.
- Save a screenshot per flow to `qa-results/$RUN_ID/`. When `imagemagick: true`, build a before/after GIF for flows with a visible state change (for example W5 before and after checkout).

## Known Failure Modes

1. **Server not running.** Products never appear and the grid stays empty. Check `qa-results/$RUN_ID/server.log`; report BLOCKED if the server did not start.
2. **Port already in use.** `EADDRINUSE` in the log. Start on another port and use that base URL.
3. **Stale element references.** The bag panel re-renders its whole list on every change, so element refs from an earlier snapshot go stale. Re-snapshot before each click.
4. **Order numbers reset.** `BW-1001` repeats after every server restart. Match the pattern `BW-\d+`, not a fixed number.
5. **UI and server totals can disagree.** The bag computes its own totals in `public/app.js`, while the confirmation shows the server's total. Always compare "Total due" with "Total charged".
