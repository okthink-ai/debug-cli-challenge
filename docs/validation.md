# Maintainer validation — October 6, 2026 (US Eastern)

**Spoilers below.** Start with the README for an unspoiled attempt.

These are authoring-agent rehearsals, not independent attendee sessions or a
benchmark of how quickly an unfamiliar agent can build the CLI. Both published
branches retain all three bugs. Temporary repairs and the small first-observation
prototype were removed after verification.

## Simplified first exercise

The README now starts with one web action: complete **Send the launch checklist**,
then refresh. On `main`, a temporary development bridge exposed one task with its
platform, fixture run ID, and observation time. A small Node command evaluated
that query over CDP. Real Playwright checkbox and refresh input produced:

| Observation | Task completed |
| --- | --- |
| Before clicking | `false` |
| After the app acknowledged the click | `true` |
| After refresh | `false` |

The [captured observations](evidence/simplification/first-observation.json) share
one fixture run ID. This rehearses the proposed first step—building a useful
observation before growing a larger tool. It does not establish that a newcomer
will finish within a particular time. No CLI or bridge was left on `main`.

On `solution`, default `state` output is now a projection made inside the running
app. One [same-fixture comparison](evidence/simplification/output-sizes.json) was
654 characters / 29 lines versus 49,133 characters / 1,738 lines for the full
snapshot. `--task` selects a task; `--full` and `--out` retain access to complete
evidence. Missing tasks produce an unknown result and exit code 2. The initial
help screen introduces only connection, state, and request tracing.

## Checks performed

Both branches passed API/unit tests, TypeScript, lint, formatting, production web
export, and two isolated browser smoke tests. The browser tests create a task
through the real UI, reload it, and exercise the visible highlight switch. They
use their own ports and SQLite file. Production exports contain no debug bridge.
The GitHub workflow runs the same infrastructure checks, including Chromium.

Repair acceptance is separate from that passing suite:

- `npm run accept` fails on the shipped completion persistence and unchanged-row
  highlighting bugs. Temporary SQL and stable-row-prop repairs made both checks
  pass on `main`; those edits were then removed.
- `npm run accept:ios` used actual Maestro input on iOS Simulator and failed at
  the expected successful-add assertion. The native runtime retained `urgent` /
  revision 1 and the API returned 422, while web retained `high` / revision 2.
- On `solution`, `npm run test:challenge` passed using a real browser checkbox,
  request/SQL/SQLite evidence, real draft typing, and a successful web add. This
  check expects the baseline defects; it is not repair acceptance.

The backend, store, domain types, fixtures, and highlight control are identical
between branches. The solution UI differences install the development bridge
and React Profiler wrappers. There is no hidden repair mode.

## Current React captures

120 tasks, draft **Rehearse**, development builds, highlights off, zero dropped
events. The visible switch was also checked on native. A setup effect initially
added noise to profiling; moving highlight reset work outside ordinary draft
updates restored the expected baseline counts before publishing.

| Runtime / actual input | Unchanged row commits | Distinct rows | Screen commits |
| --- | --- | --- | --- |
| Web / Playwright keys 75 ms apart | 960 | 120 | 8 |
| iOS Simulator / Maestro input | 360 | 120 | 3 |

Raw callback events: [web](evidence/simplification/web-react.json.gz),
[iOS](evidence/simplification/ios-react.json.gz). Native input coalesces updates;
these are not equal intermediate input states or production latency benchmarks.
The useful observation is that unchanged rows commit during draft entry. The
synthetic history workload amplifies the cost and is explicitly documented.

## Earlier repair rehearsal and remaining validation

The [earlier report](https://github.com/okthink-ai/debug-cli-challenge/blob/4f5c029/docs/validation.md)
records temporary repairs across the stack, native preference migration with a
cold restart, and reduction to zero unchanged-row commits on both runtimes.
Its linked raw evidence remains in this branch. Those timings belong to that
historical source state, not to the simplified UI above.

Local environment: macOS arm64, Node 25.8.2, Expo 55.0.31, React 19.2.0,
React Native 0.83.10, Chrome, and iPhone 17 Pro / iOS 26.5 Simulator with Expo Go
and Hermes. Capture timestamps are October 7 UTC, October 6 US Eastern.

No physical-device, Android, release-native, GPU/frame-rate, or independent
newcomer test was performed. The [first-use protocol](newcomer-session.md) is ready
for three unfamiliar engineers; its readiness targets are proposed, not measured.
