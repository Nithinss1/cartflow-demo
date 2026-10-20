# CartFlow — Demo Checkout

A small fictional e-commerce checkout application built to demonstrate an AI-assisted bug investigation workflow. Uses Node.js (18+) with no third-party dependencies.

## Run locally

```bash
npm start
```

Open http://localhost:3000. Enter a discount code and click **Apply**.

Available codes: `SAVE10` ($10 off), `SAVE25` ($25 off), `SAVE30` ($30 off). The sample item costs $25.

## Tests

```bash
npm test
```

## Intended demo

The starter repository contains an intentionally unresolved checkout edge case. The existing tests pass but do not cover the customer-reported edge case. Create a GitHub issue reporting that applying `SAVE30` to a $25 cart produces a negative total. Ask Factory to investigate the issue, reproduce the defect, propose a fix, add a regression test, and present the changes for human review.

**Demo only:** No authentication, database, real payments, or production integrations. Do not use for real commerce.
