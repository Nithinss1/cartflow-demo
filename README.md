# CartFlow — Demo Checkout

A small fictional e-commerce checkout application built to demonstrate an AI-assisted bug investigation workflow. Uses Node.js (18+) with no third-party dependencies.

## Run locally

```bash
npm start
```

Open http://localhost:3000. Add products to your bag, optionally apply a discount code, and click **Checkout**.

Available codes: `SAVE10` ($10 off), `SAVE25` ($25 off), `SAVE30` ($30 off).

## Tests

```bash
npm test
```

## Intended demo

The starter repository contains an intentionally unresolved checkout defect. The existing tests pass but do not exercise the request the browser actually sends. Create a GitHub issue reporting that clicking **Checkout** always shows "We couldn't place your order" instead of an order confirmation. Ask Factory to investigate the issue, reproduce the defect, propose a fix, add a regression test, and present the changes for human review.

**Demo only:** No authentication, database, real payments, or production integrations. Do not use for real commerce.
