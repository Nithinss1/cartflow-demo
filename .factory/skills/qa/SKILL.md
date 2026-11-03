---
name: qa
description: >
  Run QA tests for Brightwell Goods (cartflow-demo). Analyzes the git diff to determine
  affected areas, runs the relevant storefront and API flows as a guest shopper, and
  generates diff-targeted tests. Uses droid-control for browser interactions and curl for
  the JSON API. Use when testing PRs, releases, or smoke testing the app.
---

# QA Orchestrator

**SCOPE: This skill performs manual/functional QA only. It verifies that the application actually works by interacting with it as a real user would (browser and API calls). Do NOT run or report on CI checks, linting, typecheck, unit tests (`npm test`), or any static analysis. Those are handled separately.**

**Never silently skip a flow. If a flow cannot complete, report it as BLOCKED with what was tried and how the user can fix it.**

## Step 1: Load Configuration

Read `.factory/skills/qa/config.yaml` for the environment, start command, personas, and app definitions. It is the single source of truth.

For every affected interactive app (`test_tool: agent-browser`), invoke the `droid-control` skill before interacting with the app. Follow its routing tables:

- Load the target driver for the app (web page → the **browser-use** atom).
- Use the Capture and Verify stages on every run.
- Load Compose only when both `video_evidence: true` and `droid_control.compose: true`.
- When `droid_control.compose` is false, never invoke Compose. Keep raw captures and text snapshots as evidence.

Treat `video_evidence` and `droid_control.compose` as runtime toggles. Read them from config on every run; never cache or assume a value.

## Step 2: Determine Target Environment

Use `default_target` (`local`) unless the user names a different one. There are no preview or remote deployments for this project.

- Start the server from the checked-out branch with the configured `start_command`, in the background, logging to `qa-results/$RUN_ID/server.log`.
- Poll the configured `ready_check` (up to 30 seconds) before testing.
- If port 3000 is busy, start on a free port (`PORT=<port> npm start`) and use that base URL everywhere.
- Never fall back to a remote URL. If the server cannot start, report every affected flow as BLOCKED with the last lines of `server.log`.
- Stop the server when testing is finished.

## Step 3: Analyze Git Diff

Determine what changed. In CI, diff against the base branch given in the prompt (for example `git diff origin/main...HEAD`). Locally, use `git diff origin/main...HEAD` plus any uncommitted changes. Map changed files to apps using `path_patterns` in config.yaml:

| Changed path | Apps |
| --- | --- |
| `public/**` | web |
| `server.js`, `src/**` | web and api |

Files that match no app's path_patterns (for example `.factory/**`, `.github/**`, `tests/**`, `README.md`, `package.json`) are NOT associated with any app. Do NOT run app flows for them.

For each affected app:

- Run ONLY that app's relevant flows from its sub-skill.
- Generate ADDITIONAL targeted tests based on the specific changes in the diff.

For apps NOT affected by the diff, do not load their sub-skill, run their flows, or run their pre-flight checks.

If NO app is affected (docs-only, CI-only, tests-only, or skill-only changes), report INCONCLUSIVE: "No app code changed -- QA not applicable for this diff." Do NOT run any app flows.

## Step 4: Pre-flight Checks (affected apps only)

- Any affected app: `node --version` is 18 or later, and the server starts and passes the ready check.
- web: `droid-control@factory-plugins` is active and its browser driver launches.
- api: `curl` and `jq` are available.
- Compose prerequisites from the droid-control skill: only when `droid_control.compose: true`. When Compose is on, let the droid-control Compose stage resolve its own plugin root and install its locked dependencies if missing. Never install them when Compose is off.

If a pre-flight check fails for an affected app, report that app's flows as BLOCKED with the specific error and remediation, then continue with the other affected app.

## Step 5: Execute Diff-Relevant Flows Only

For each affected app, read `.factory/skills/qa-<app-name>/SKILL.md`. It contains a MENU of flows plus a file-to-flow map. You must:

1. Read the diff and pick the flows relevant to the change.
2. Run those flows PLUS adjacent flows that verify the change integrates correctly (for example, a pricing change in `src/checkout.js` also needs the checkout confirmation total checked).
3. Not run unrelated flows.
4. Write a NEW ad-hoc test when no existing flow covers the changed behavior.
5. Not run `npm test` or any automated suite. Interact with the app as a real user would.

## Step 6: Evidence Capture

Generate a run ID at the start (`RUN_ID` from the environment if set, otherwise `$(date +%s)-$$`). Save all evidence files under `./qa-results/$RUN_ID/`.

For the web app (through droid-control):

- Use the droid-control web route; its browser-use atom owns browser mechanics and its Capture atom owns the recording lifecycle.
- Capture the accessibility tree as text evidence after each significant step. Trim to the relevant region (bag panel, notice, confirmation).
- Save screenshots to `./qa-results/$RUN_ID/`. If `imagemagick: true` and a flow has meaningful before/after screenshots, also produce an animated GIF diff (`magick -delay 120 before.png after.png -loop 0 <flow>-diff.gif`; use `convert` with the same arguments if `magick` is missing).
- Each snapshot must show something different. Wait for the UI to change before capturing again.

For the API (curl):

- Embed the exact request and the trimmed response (status line plus JSON body) as a labeled fenced code block.

**When `video_evidence: false`, or when an upload fails:** evidence is text-first. Do NOT embed `![image](url)` markdown; artifact URLs do not render in PR comments. Mention screenshot/GIF filenames and note they are in the downloadable workflow artifacts.

**When `video_evidence: true`:**

1. Follow the droid-control Capture atom to record exactly one video per web flow.
2. If `droid_control.compose` is false, keep the raw WebM. If it is true, hand the raw recording to the droid-control Compose atom with a `single` layout and the literal `"preset": "factory"`, trim dead time, add a concise title card, keep it to 60 seconds or less, and render `./qa-results/$RUN_ID/<flow-slug>.mp4`. Never use any other preset.
3. Verify the file exists and is non-empty; retry a failed stage once, then fall back to text evidence.
4. Upload with the GitHub user-attachments endpoint (undocumented; trust the live response):

   ```bash
   REPO_ID="${REPO_ID:-$(gh api "repos/$GITHUB_REPOSITORY" --jq .id)}"
   curl -sS --fail-with-body --request POST \
     --header "Authorization: Bearer $QA_EVIDENCE_TOKEN" \
     --header "Content-Type: application/octet-stream" \
     --header "Accept: application/json" \
     --header "X-GitHub-Api-Version: 2022-11-28" \
     "https://uploads.github.com/user-attachments/assets?name=<evidence-file>&content_type=<url-encoded-content-type>&repository_id=$REPO_ID" \
     --data-binary "@./qa-results/$RUN_ID/<evidence-file>" \
   | jq -e '.url'
   ```

   `QA_EVIDENCE_TOKEN` must be a classic PAT with `repo` scope. A 404 means an installation token was used; a 403 "Resource not accessible by personal access token" means a fine-grained PAT; a 403 about SAML means the token needs SSO authorization.
5. Put each returned video URL alone on its own line under the flow's label (never wrap it in `![]()`). Screenshots uploaded the same way use `![name](asset-url)`. Never embed a URL that did not come back from the upload response.

## Step 7: Test Quality Gate

1. CHANGE-SPECIFIC FIRST. At least half the tests directly verify the changed behavior.
2. INTEGRATION TESTS ARE VALID. Verify the change still works end to end (for example, the UI total, the API order total, and the confirmation "Total charged" agree).
3. NO UNRELATED FLOWS.
4. NO AUTOMATED TEST SUITES. Do not run `npm test`, `node --test`, or any CI-style checks.
5. NEGATIVE TESTS. Include at least one error or boundary test related to the change (invalid code, discount larger than subtotal, empty bag, bad payload).
6. INTERACTIVE TESTING. Drive the real storefront in a browser and the real API over HTTP.
7. INCONCLUSIVE IF UNSURE. If you cannot state what the PR changes, mark INCONCLUSIVE rather than PASS.

## Step 8: Handle Failures

Never silently skip a flow. If a flow cannot complete, report it as BLOCKED with what was tried and how the user can fix it. Then continue to the next flow; never abort the whole run for a single failure.

A flow whose observed behavior contradicts its success criteria is a FAIL, even when the behavior is pre-existing on `main`. Say so in Notes ("also fails on main").

## Step 9: Generate Report

Write the report to `./qa-results/report.md` using `.factory/skills/qa/REPORT-TEMPLATE.md`:

- Start with `## QA Report` followed by the results table.
- Result column uses: :white_check_mark: PASS, :x: FAIL, :no_entry: BLOCKED, :warning: FLAKY, :grey_question: INCONCLUSIVE.
- Keep it concise: the table, a short "Action Required" section if any, and one collapsed `<details>` block with all evidence.
- Do not report setup steps (installing, starting the server) as test rows.
- Do not add a behavioral-change summary, an info table, or verbose prose.

## Step 10: Failure Learning

After the report, check whether any BLOCKED or FAIL result revealed a new **testing-environment insight** that would help future runs (for example: "the server needs 5+ seconds to start on CI", "port 3000 is taken on the runner", "the bag panel re-renders and stale refs must be re-snapshotted"). Do not suggest fixes for bad selectors, skill typos, or product bugs that the PR introduced.

Add a section to the report in this format:

```markdown
## Suggested Skill Updates (N issues found)

| #   | Severity        | File     | Issue               | Fix Prompt                                                                           |
| --- | --------------- | -------- | ------------------- | ------------------------------------------------------------------------------------ |
| 1   | <emoji> <level> | `<file>` | <short description> | <details><summary>Copy</summary><br>`<full droid prompt to fix the issue>`</details> |
```

Severity: `🔴 Breaking` (fails every run), `🟡 Degraded` (intermittent or suboptimal), `🔵 Info` (new knowledge).

Read `failure_learning` from config.yaml:

- `suggest_in_report`: include the table only.
- `auto_commit` or `open_pr`: include the table AND write `qa-results/skill-updates.json` so the workflow can apply the edits:

```json
[
  {
    "file": ".factory/skills/qa-web/SKILL.md",
    "section": "Known Failure Modes",
    "action": "append",
    "content": "6. **Slow server start on CI.** Allow up to 30 seconds for the ready check before reporting BLOCKED."
  }
]
```

`file` must be a path under `.factory/skills/`. `section` is the markdown heading text. `action` is `append` or `replace`. `content` is the exact markdown to insert.

If no new environment insight was found, omit the section and do not write the JSON file.
