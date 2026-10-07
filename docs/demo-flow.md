# Demo flow: give the agent observations it can reuse

Audience: engineers trying the challenge or presenting it. This is the delivery
writeup for the standalone repo; it supersedes the earlier prepared demo's
fixture-switching flow. The app bugs remain in both published branches.

## Intended result

Show an agent moving from a reported symptom to runtime evidence, a concrete
explanation, an actual code repair, and the same verification afterward. Each
beat adds a different observer: another platform, another layer, then React's
rendering behavior. Show the command and its evidence alongside the app.

A successful demo establishes three things:

1. The agent observes the actual target and current fixture, not just source code.
2. A tool can reconcile conflicting observations across clients and the stack.
3. Verification repeats the user action and checks a product invariant after a repair.

Do not claim a prepared CLI was invented live. Do not switch to a completed
repair offstage. If time is short, demonstrate one complete investigation and
use recorded evidence for the remaining beats, clearly labeled.

## Two delivery paths

**Build the tools:** start on `main`, create a working branch, reproduce the
symptoms, and prompt the agent to build a CLI. Allow time for discovery and
instrumentation; this is a workshop, not a guaranteed five-minute live build.

**Use the tools:** start on `solution`, create a working branch, and ask the
agent to inspect CLI help and use it to solve the app. The reference CLI is
already built; the app is still broken. Budget roughly 12–15 minutes for a
rehearsed walkthrough, longer for live investigation and coding.

## Before the audience arrives

- Run the README setup and checks. Open web and actual iOS Simulator clients.
- Reset 120 tasks, reload both clients, and confirm the same fixture run ID.
- Confirm Chrome and Hermes targets are available. If iOS is unavailable, label
  the platform/native checks incomplete; never replace them with mobile web.
- Make a branch for live repairs. Keep a clean baseline commit to return to.
- Let initial border flashes settle. Use one consistent task count, draft,
  typing method, flash setting, and build type for performance comparisons.
- Rehearse each action. Save raw JSON beside any screenshot or video clip.

## Opening: one symptom (about 2 minutes)

Open the web app. Complete the first seeded task and press Refresh. Show the
contradiction, then give the agent the short README prompt. Reserve native and
performance for later beats so the audience can follow one investigation first.

On `main`, show the first observation being built: a small bridge diff, a CDP
query against the live task, and the query becoming a reusable CLI command.
State that raw request/SQL records are supplied by the exercise. On `solution`,
label the CLI as a prepared example and show `doctor`, `state`, and `trace`.
Don't imply prepared tooling was invented live.

## Beat 1: follow “saved” through the stack (about 4 minutes)

Prompt:

> Completing a task says it was saved, but refresh undoes it. Use the debug CLI
> to follow one request through the frontend, backend, and SQLite. Identify the
> first disagreement, make a focused repair, and prove the completion persists.

Show the checked row and success message, the request ID, the backend record,
and a fresh persisted row. Explain which observations agree and which do not.
After editing, repeat a real click, inspect a new request, refresh, and restart
the client. The stored value must continue to match the user's intent.

Takeaway: a successful response is evidence about the response, not enough
proof of the intended persisted effect.

## Beat 2: compare platforms (about 4 minutes)

Reset/reload both clients if needed. This resets data, not the preceding fix.

Prompt:

> Adding a high-priority task works in Chrome and fails on iOS. Compare the live
> clients and their requests against the same server. Explain the divergence,
> fix it without weakening validation, then verify a real native tap and restart.

Show both composer labels, the different runtime state or payloads, and the
server's handling of each. After repairing, repeat both submissions. Cold-start
iOS and submit again; inspect the created SQLite row. Do not use a CDP store
action as your only proof that a native interaction works.

Takeaway: source code shared between platforms does not imply identical runtime
state. Native persistence and lifecycle deserve their own observations.

## Beat 3: measure unrelated rendering (about 4 minutes)

Reset/reload to 120 rows. Type **Rehearse** without submitting. First enable
flashes to illustrate the behavior; then disable them for the numerical capture.

Prompt:

> Draft typing makes unchanged task rows flash. Capture React metrics through
> CDP around real input, identify the unnecessary work, and repair it. Compare
> the same input before/after on web and iOS. Verify adding and toggling still work.

Show row commit counts, distinct rows, and screen render durations, naming the
build and platform. Save the raw capture. Repeat the same text and input method
after the code change. Explain that development timings include instrumentation
and are not claims about production latency or native frame rate.

Takeaway: visual flashing makes the symptom legible; structured metrics let the
agent test whether its repair actually removes unnecessary work.

## Close: keep the instrument (about 1 minute)

Show one command rerunning a previously manual check. Ask the agent to improve
its CLI based on anything it struggled to observe. The lasting deliverable is
both repaired behavior and a useful tool for investigating the next issue.

## Material to capture

| Asset | What the viewer should see | Evidence to preserve |
| --- | --- | --- |
| Stack before/after | Complete → refresh in the real UI | Request IDs, frontend/backend trace, persisted rows |
| Web/iOS pair | Same task submission in both clients | Target identity, fixture run ID, request/response, SQLite row |
| Performance pair | Same draft input and row flashing | Raw React capture; separate CPU profile if available |
| CLI excerpt | One small, readable diagnostic result | Full original JSON, timestamp, commit and environment |

Use actual captures. Include platform, source commit, fixture count, and whether
the app was repaired in captions/manifests. Keep files under ignored `artifacts/`
until deliberately selected for publication. Existing talk recordings predate
this extraction and use the older prepared fixtures; they are not evidence that
this standalone challenge or a live agent performed those repairs.
