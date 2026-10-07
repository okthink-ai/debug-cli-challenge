# Maintainer rehearsal — October 6, 2026 (US Eastern)

**Spoilers below.** For an unspoiled attempt, start with the README symptoms.

The coding agent that extracted this repository used the reference CLI to
observe the running web and iOS apps, made temporary code repairs, and repeated
the interactions. This was a maintainer rehearsal with knowledge of the seeded
bugs, not a blind-agent benchmark or a timed claim about building the CLI live.
The temporary repairs were then removed. Both published branches remain broken.

## Environment and branch boundary

- macOS arm64, Node 25.8.2; Expo 55.0.31, React 19.2.0, React Native 0.83.10.
- Chrome web development build; iPhone 17 Pro / iOS 26.5 Simulator, Expo Go,
  Hermes; Playwright browser input and Maestro native input.
- `main` base commit: `c7e282f`; instrumented application source: `1edf227`.
- `server/`, `src/store.ts`, and `src/types.ts` are byte-identical between the
  published branches. UI differences only add bridge installation and profilers.
- All captures use synthetic data and loopback services. Raw timestamps are UTC
  (October 7); the rehearsal took place October 6 in US Eastern time.

A fresh detached checkout of `main` passed `npm ci`, its API smoke test,
TypeScript, lint, and the production web export independently of the presentation
repository. The extracted main app also passed real browser add and
completion/refresh checks with no `__TODO_DEBUG__` bridge installed. The
instrumented branch passed its five API/evidence tests, TypeScript, lint,
production web export, real browser checks, and the native exercises below.
No private packages or parent repository configuration were needed.

## What the observations established

| Problem | Broken baseline | Temporary repair and repeated check |
| --- | --- | --- |
| Across the stack | The clicked checkbox and HTTP 200 said completed. The joined request showed `WHERE id=?` receiving `task-001`, zero affected rows, and stored `completed: 0`. | Update by the public ID, require one affected row, and return the stored row. Real click → fresh trace passed; SQLite held `completed: 1` through UI refresh and browser reload. |
| Between platforms | Live web held `high` / revision 2; native held restored `urgent` / revision 1. A real native submission received HTTP 422. | Reconcile the historical preference against current capabilities and persist the migrated native preference. Real native tap returned 201 with a matching SQLite row. A second cold restart restored `high` / revision 2 and another real submission passed. Server validation stayed intact. |
| React Native performance | Draft-only input committed all 120 unchanged rows repeatedly on both runtimes. | Keep row objects/callbacks stable and memoize activity derivation by task ID. Identical draft text produced zero row commits on web and iOS. Actual web add/toggle/refresh and native add continued to work. |

The repository does not include the temporary repaired application or a repair
switch. The local rehearsal patch's SHA-256 is recorded in
[measurements.json](evidence/measurements.json) to distinguish its provenance.
These results establish that the exercise is solvable with the provided
observations; they are not a guarantee about every agent or device.

## React captures

120 tasks, draft **Rehearse**, development builds, flash disabled, no dropped
events. These are individual local captures, not repeated benchmark averages.

| Runtime and input | Row commits: broken → repaired | Screen commits: broken → repaired | Sum of screen React render durations (ms): broken → repaired |
| --- | --- | --- | --- |
| Web, Playwright keys 75 ms apart | 960 → 0 | 8 → 8 | 420.1 → 17.9 |
| iOS Simulator, Maestro `inputText` | 360 → 0 | 3 → 8 | 1212.5 → 25.1 |

Native text events may coalesce: the slow baseline committed three text updates,
the repaired run eight. The native input driver and final text were the same,
but these are **not** equal numbers of committed intermediate text states.
The useful invariant is that unchanged task rows no longer commit during draft
entry. Do not compare native and web milliseconds as if they used the same
input cadence, or present these figures as production input latency/frame rate.

The final web baseline was captured again after removing the temporary repairs,
so its timestamp is later than the repaired capture. “Before/after” filenames
identify broken/repaired behavior, not the chronology of every rehearsal step.
Earlier captures also found 960 web row commits. Numbers here use the retained
raw evidence, not the older presentation's prepared-fixture recordings.

## Evidence files

- [Stack baseline](evidence/stack-before.json) and [repair trace](evidence/stack-after.json).
- [Platform comparison baseline](evidence/platform-before.json) and [repair comparison](evidence/platform-after.json).
- [Native rejected submission](evidence/ios-add-before.json), [accepted submission](evidence/ios-add-after.json), and [cold-restart submission](evidence/ios-cold-restart.json).
- [Preference restored after restart](evidence/ios-restored-after.json).
- [Measurements and environment](evidence/measurements.json).
- Raw React events: [web baseline](evidence/perf-web-before.json.gz), [web repair](evidence/perf-web-after.json.gz), [native baseline](evidence/perf-ios-before.json.gz), [native repair](evidence/perf-ios-after.json.gz). These are gzip-compressed JSON.

Each trace carries request ID and run ID. The platform and stack exercises used
different resets; compare IDs within each trace, not across unrelated exercises.
The complete local Chrome CPU captures are kept under ignored `artifacts/`;
the published React captures contain the actual callback events used for the
counts and durations above.

After removing repairs, the broken-state web check was repeated and native was
cold-started against a new fixture to confirm the failure remained available
for the next engineer. Missing observers and stale runs also have explicit
unknown-result coverage in the evidence unit tests.

Limitations: no physical-device, Android, release-native, GPU/frame-rate, or
blind-agent benchmark was performed. The web production export was a build
check; the interactive diagnostics were exercised against development builds.
