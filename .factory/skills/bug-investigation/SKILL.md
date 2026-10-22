---
name: bug-investigation
description: End-to-end bug investigation workflow for a GitHub issue. Use when an engineer provides a GitHub issue URL and wants the bug reproduced, root-caused, minimally fixed, regression-tested, and delivered as a pull request for human review. Never merges changes and never modifies the main branch.
---

# Bug Investigation

Turn a GitHub issue into a review-ready pull request through a disciplined,
repeatable investigation. The deliverable is always a PR for human review,
never a merge.

## Inputs

- A GitHub issue URL (required).
- Optional extra context or constraints from the engineer.

## Guardrails (non-negotiable)

- NEVER commit to, push to, or merge into `main` or the repository's default branch.
- Work only on a dedicated feature branch named `fix/<issue-number>-<short-slug>`.
- Open the PR for review, then stop. Never merge, never approve, never leave review comments as the repo owner.
- Implement the smallest safe fix: no refactors, no drive-by changes, no dependency changes unless the bug cannot be fixed without them.
- If reproduction fails or the root cause is not confidently identified, STOP and report findings instead of guessing at a fix.

## Workflow

### Step 1 — Read the issue

Fetch the issue with `gh issue view <number> --repo <owner>/<repo>` (or
FetchUrl if `gh` is unavailable). Extract:

- Reported behavior vs expected behavior
- Steps to reproduce and environment details
- Business impact and acceptance criteria

Restate the bug in one sentence before continuing.

### Step 2 — Explore the repository

Map the code paths involved in the reported behavior: modules, functions,
configuration, and the tests that cover the affected feature. List the
relevant files with a one-line note on why each matters.

Optional but recommended: delegate Steps 2-4 to the read-only
`bug-investigator` subagent via the Task tool. Its enforced read-only tool
policy guarantees the investigation phase cannot mutate the repository.

### Step 3 — Reproduce

Reproduce the issue locally and capture evidence: the exact commands run and
their output, or the failing interaction with the running application.

- If the issue reproduces, record the evidence and continue.
- If it does not reproduce, report exactly what you tried (commands,
  environment, versions) and STOP. Do not proceed to a fix without a
  reproduction or an explicit engineer override.

### Step 4 — Root cause

Trace the defect to its origin. State the root cause as a precise one-sentence
claim with `file:line` references. Note any adjacent code that shares the same
defect pattern.

### Step 5 — Smallest safe fix

Create the feature branch and implement the minimal change that fixes the
root cause. Match existing code style and comment density. If more than one
viable fix exists, present the options with a recommendation before editing.

### Step 6 — Regression tests and full suite

Add a regression test that:

- Fails without the fix (demonstrates the bug).
- Passes with the fix.
- Matches the repo's existing test framework and naming conventions.

Run the full test suite. All tests must pass, including pre-existing ones.
If pre-existing tests fail for unrelated reasons, report them and do not
include unrelated fixes.

### Step 7 — Open the PR

Push the feature branch and open a PR using `pr-report-template.md` beside
this file. The PR description must include:

- Issue link (`Fixes #N` is fine; the PR itself stays unmerged)
- Root cause with `file:line` references
- Reproduction evidence
- Summary of the fix and why it is the smallest safe change
- Test evidence: new regression test plus full-suite results

Finally, present a short summary to the engineer and wait for human review.
Do not merge.

## Completion criteria

The workflow is complete when a PR exists that links the issue, contains the
root-cause analysis and test evidence, and passes the full test suite. The
engineer's review and merge are deliberately outside this workflow.
