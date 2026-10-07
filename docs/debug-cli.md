# Reference CLI: observation before repair

This is the tooling solution. `App.tsx`, `src/store.ts`, and `server/` still
contain the challenge bugs. The only UI changes from `main` install the debug
bridge and wrap the screen and rows in React profilers. The backend and client
business logic are identical. There is no fixed fixture or repair command.

## Establish identity

```sh
npm run debug -- browser
npm run debug -- doctor
npm run debug -- doctor --target ios
npm run debug -- state --target web --out artifacts/web.json
npm run debug -- state --target ios --out artifacts/ios.json
npm run debug -- compare
```

Web discovery uses Chrome's `/json/list` at port 9337. Native discovery uses
Metro's `/json/list` at port 8087 to connect to the real Hermes runtime. The CLI
probes the development bridge for app and platform identity rather than taking
the first target. Ambiguous matches require `DEMO_TARGET_ID`; unavailable
observers produce an unknown result. Fixture run IDs must match after a reset.

`doctor` checks attachment and backend agreement, not whether the app is correct.
`compare` checks the initialized priority contract; passing it is not proof of
successful native interaction. Capture a real submission separately.

## Follow one request

Perform a real checkbox click or task submission, then:

```sh
npm run debug -- requests
npm run debug -- trace last --out artifacts/trace.json
npm run debug -- trace last --target ios --out artifacts/native-trace.json
npm run debug -- server
npm run debug -- database task-001
```

Prefer `trace <request-id>` when investigating an earlier action. `last` means
the last non-GET request for the selected platform. Request history is bounded
to the last 40 records per observer, so capture it before doing more actions.

The trace joins a frontend request with a backend execution record and opens
SQLite independently in **read-only** mode. It includes the intended payload,
status, SQL parameters, affected-row count, historical before/after rows, and
the current database row. The current row is a present observation; it is not a
transaction snapshot if later actions changed the same task. Keep a capture
immediately after the action for an unambiguous demonstration.

The public API and SQLite are ordinary transports for the backend/database.
CDP is used for the frontend runtimes; this does not pretend SQLite speaks CDP.

## Capture React work

For a repeatable web capture using actual browser key events:

```sh
npm run reset
# Reload both clients, wait for initial rendering to settle.
npm run debug -- perf-type Rehearse --out artifacts/web-before.json.gz
```

`perf-type` clears the draft before measurement, disables flashes by default,
types one character every 75 ms, and returns a summary. The artifact contains
React commit events and a separate Chrome CDP CPU profile. Elapsed time includes
scripted delays and is **not input latency**. `--flash` is useful visually, but
adds animation work: use the same setting for comparable captures.

For actual native input:

```sh
npm run debug -- perf-start --target ios
# Tap the draft and type Rehearse in the iOS Simulator, manually or with Maestro.
npm run debug -- perf-stop --target ios --out artifacts/ios-before.json
```

Clear the draft before starting and don't submit during measurement. The
capture automatically stops after 60 seconds and caps at 40,000 events,
reporting any dropped events. Native timing availability is reported explicitly.
There is no `perf-type --target ios`: browser input is not a native driver.

After a repair, reset to the same task count, reload, and repeat the same input
method, text, flash setting, and build. Compare row commits/distinct rows and
screen render durations. Verify add/complete/refresh still work.

The root `TodoScreen` profiler includes its descendants' React render work.
Row profilers live inside each row and count its committed subtree; their
individual duration does not include all work done before that wrapper is
returned. Do not sum nested profiler durations as if they were disjoint CPU
samples. React durations do not measure native layout, GPU work, or frame rate.
Use Instruments/native tooling for those questions.

The border flash effect doesn't set React state. Nevertheless, its animation
adds work and should be disabled for the numerical comparison. Measurements
here use development builds, not production performance guarantees.

## Reset and input semantics

`npm run debug -- reset [--count 120]` resets sample data only. Browser reload
and native cold-start are preferred after reset. `reload --target ios` invokes
an application initialization action; it is convenient for inspection but is
**not** a cold restart. None of the bridge's application actions prove hit testing.

The UI driver in `perf-type` uses Playwright; native gestures require a separate
driver or person. `screenshot --out artifacts/web.png` captures web. For native
pixels use `xcrun simctl io booted screenshot artifacts/ios.png`.

## Output contract and implementation

Run `node debug-cli/cli.mjs ...` directly when stdout must be pure JSON (npm
prints its script header). Exit codes:

| Code | Meaning |
| --- | --- |
| 0 | Observation returned or checked claim passed |
| 1 | Observed failure of a checked claim |
| 2 | Unknown, missing target/evidence, timeout, or invalid input |

A known failure remains visible even when another observer is missing. Success
is scoped to the claim in the result, not a blanket declaration that the app is
healthy. Use `--out` to preserve full evidence; `.gz` paths compress JSON.

| File | Role |
| --- | --- |
| `debug-cli/cdp.mjs` | WebSocket CDP transport, target discovery, bounded calls |
| `debug-cli/cli.mjs` | Product commands, joins, read-only DB access, browser input |
| `debug-cli/evidence.mjs` | Pass/fail/unknown rules with unit coverage |
| `src/debug.ts` | Development-only runtime bridge exposing state and controls |
| `src/performance.ts` | Bounded collector of public React Profiler callbacks |

Environment overrides: `DEMO_CDP` (Chrome endpoint), `DEMO_METRO` (Metro endpoint),
`DEMO_TARGET_ID`, `DEMO_API_URL` (CLI backend), `DEMO_DB` (same file as server),
`DEMO_WEB_URL` (web discovery URL), and `CHROME_PATH` (browser executable).
The app's API URL is separately configured by `EXPO_PUBLIC_API_URL`.
The `browser` convenience command opens the default URL/port; custom endpoints
should be launched manually. Keep exact backend URLs aligned across app and CLI.

## Troubleshooting and verification

- No web target: open the development app, not the exported production bundle.
  Reload after branch switching. Use a separate Chrome profile and check 9337.
- No iOS target: open Expo Go on the simulator; check Metro 8087; close competing
  DevTools sessions. A simulator browser is still a web runtime.
- Stale run IDs: reload both clients after reset. Do not mix traces across runs.
- Database unavailable: verify `DEMO_DB` matches the server's startup log. A
  missing file is unknown evidence; the CLI won't silently create one.
- Expo SDK mismatch: install an SDK 55 compatible Expo Go, or build a matching
  development client. Do not update Expo alone to work around a client mismatch.

`npm run test:challenge` checks the **shipped broken web state** through real
input and the CLI, writing ignored artifacts. Run the dev server and `debug
browser` first. It expects failure evidence and 960 row commits for eight
characters/120 rows. It is a fixture check, so it should stop passing after
repairs. Replace its expectations with your regression checks. It does not
claim native coverage; follow the native procedure above separately.
