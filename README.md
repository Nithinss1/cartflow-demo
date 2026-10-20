# CartFlow Demo

A fictional e-commerce checkout service for demonstrating an AI-assisted bug investigation workflow with Factory.

## Run tests

Requires Node.js 18 or later.

```bash
npm test
```

## Scenario

A customer reports that applying a fixed-value discount to a small cart can produce a negative checkout total. The intended business rule is that the final total must never fall below $0.

This repository deliberately includes the bug. Do not fix it before the Factory demonstration.
