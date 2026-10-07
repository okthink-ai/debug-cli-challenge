# Use the example CLI

The app is still broken. The CLI supplies observations, not a repair switch.
Start the app using [setup](setup.md), then follow one action through the stack.

## First investigation

```sh
npm run debug -- browser
npm run debug -- doctor
npm run debug -- state
```

`doctor` verifies the attached target and backend fixture. `state` returns compact
JSON: runtime identity, task counts, settings, draft, and the latest request.
It sends the summary through CDP rather than serializing the whole store.

Complete **Send the launch checklist** in the real UI. Before refreshing:

```sh
npm run debug -- state --task task-001
npm run debug -- trace last --out artifacts/completion.json
```

The trace joins client intent, the backend record, and an independent read-only
SQLite query. Normal output shows the disagreement without a long store dump.
`--out` saves complete evidence while keeping the terminal compact. Use a
specific request ID instead of `last` when investigating an earlier action.

After your repair, repeat the click, capture a new trace, refresh, and reload.
A connection check passing does not mean the task persisted.

## Explore in stages

```sh
npm run debug -- help
npm run debug -- help platforms
npm run debug -- help performance
npm run debug -- help tools
```

The first help screen introduces `doctor`, `state`, and `trace`. The other topics
reveal commands when you need another platform, measurement, or supporting record.
`help all` displays everything.

### Compare actual clients

Open the iOS app in the simulator, then:

```sh
npm run debug -- doctor --target ios
npm run debug -- state --target ios
npm run debug -- compare
# After an actual native submission:
npm run debug -- trace last --target ios --out artifacts/native.json
```

Both clients must share a fixture run ID. `compare` checks initialized priority
settings, not native hit testing. Use manual taps or `npm run accept:ios` for
native input, and inspect the matching request. Cold-start after a migration fix.

### Measure rendering

Reset to 120 tasks and reload. For web:

```sh
npm run debug -- perf-type Rehearse --out artifacts/web.json.gz
```

This clears the draft, disables highlights, waits for setup renders to settle,
then captures real web keystrokes, React callbacks, and a separate CPU profile.
The UI switch reflects the actual highlight setting. `--flash` enables it for
a visual demonstration; keep that setting consistent across captures.

For iOS, focus and clear the draft first. Begin capture, type manually or with
Maestro, then stop:

```sh
npm run debug -- perf-start --target ios
npm run debug -- perf-stop --target ios --out artifacts/ios.json
```

Captures stop after 60 seconds and cap at 40,000 events, reporting dropped events.
Don't change the highlight setting during capture. Compare unchanged-row commits
first, then screen durations. Native input can coalesce updates. Scripted elapsed
time includes delays and is not input latency; React durations are not GPU/native
frame timings. Individual row profiler durations exclude work before their wrapper
is returned; the screen profiler includes that work. Don't sum nested durations.

## Complete evidence when needed

- `state --full`: full runtime snapshot. `--task` selects one task in a summary;
  these two switches are intentionally mutually exclusive.
- `requests` / `server`: latest five records summarized; `--full` includes full history.
- `trace ... --full`: complete frontend/backend/database evidence.
- `perf-stop --full`: all React events. `--out file.json.gz` is usually easier.
- `database task-001`: independent read-only SQLite view.

The latest 40 requests are retained per observer. Capture an action before later
requests displace it. A current database row is not a historical transaction
snapshot if another action changed it afterward.

Use `node debug-cli/cli.mjs ...` when stdout must contain only JSON; npm prints
its own script banner. Exit codes are **0** for an observation/pass, **1** for an
observed failure, and **2** for unknown/missing/invalid input. Missing evidence
must not hide a known failure. Success is scoped to the checked claim.

## What the example adds

| File | Responsibility |
| --- | --- |
| `src/debug.ts` | Development bridge: identity, focused state, full snapshot, controls |
| `src/observations.js` | Small, testable projections of product state |
| `debug-cli/cdp.mjs` | Chrome/Hermes discovery and bounded CDP calls |
| `debug-cli/cli.mjs` | Commands, cross-stack joins, browser input |
| `debug-cli/output.mjs` | Focused terminal results; full artifacts stay available |
| `src/performance.ts` | Public React Profiler callback collector |

Chrome supplies web CDP; Metro supplies Hermes inspector targets. Backend records
use HTTP and SQLite uses its own driver. Discovery probes identity, not the entire
store. Ambiguous targets fail rather than guessing; use `DEMO_TARGET_ID` if needed.
The bridge is excluded from production exports.

`npm run test:challenge` checks the shipped broken web fixture through real input
and CLI observations. It expects defects and should stop passing after repairs.
Run the app and `debug browser` first. [Acceptance](acceptance.md) checks the
intended repaired behavior separately. The [validation report](validation.md)
contains current checks and historical repair evidence; it is not a blind attendee test.
