# Build one useful observation

Start on `main` and make a working branch. Use the short README prompt for the
completion/refresh bug. The deliverable is a reusable observation command plus
a verified repair, not a particular number of files or a copy of the reference CLI.

## First loop: one runtime

1. Reproduce the disappearing completion with a real click and refresh.
2. Ask the agent what it needs to observe. Begin with current app state in Chrome.
3. Let it add a small development-only bridge that returns selected state, then
   use CDP to call that bridge. Show the bridge diff and the live query together.
4. Turn the query into a discoverable CLI command with compact JSON output.
5. Run the command twice around an action. Confirm that it observes the running
   app and isn't printing fixture constants or a source-code prediction.

The audience should see the missing observation become available. Keep the first
query small: target identity and the selected task are enough. Connection setup
can be reused; another screenshot description shouldn't be necessary each time.

## Extend only when a question needs it

**Persistence:** join the client request, server execution record, and a fresh
SQLite read using the same request ID. Distinguish a successful HTTP response
from a persisted effect. After the repair, repeat the real click and refresh.

**Platforms:** with iOS set up, ask the same state question of the Hermes runtime.
Compare initialized settings, then submit a task with an actual native tap.
Verify the repair after a cold restart too. Calling an app action through CDP
is useful control, but doesn't establish that a native button works.

**Rendering:** type `Rehearse` without submitting. First show the row highlights.
Then turn highlights off and gather React `<Profiler>` callbacks through the
bridge. Establish which unchanged rows commit before investigating expensive
work inside them. Chrome CPU samples are a separate measurement; CDP does not
automatically know React component commit counts. Compare equivalent inputs and
keep native batching and development-build overhead visible in the explanation.

## What is already supplied

This is a scaffolded debugging exercise. `main` already includes:

- A shared Redux state model, bounded client request history, and request IDs.
- `GET /__demo/requests`: raw server records with SQL, parameters, affected rows,
  and historical before/after values. These records are not a joined verdict.
- A real local SQLite database and a fixture run ID shared by the clients.
- `src/fixtures/preferences.ts`: historical native preferences, seeded once per
  run to model an existing installation. Fix application behavior without
  replacing the old input with a conveniently fresh installation.
- `src/fixtures/activity.ts`: 48,000 deterministic records, 400 for each of the
  first 120 tasks. Keep this data fixed for comparable measurements.
- A visual row-commit indicator and its UI switch. It doesn't collect timings.

`main` has no global debug bridge, CDP client, React metric collector, or
product CLI. The agent supplies those observations and commands. This exercise
doesn't claim that raw SQL tracing was invented during a live demonstration.

## A useful tool's contract

Return the target, observation time, and fixture identity with the answer.
Make missing evidence **unknown** instead of success. Fail quickly with a clear
next step if the target is missing. Keep normal output focused and provide full
artifacts explicitly. The tool should still be useful after the bugs are fixed.

When exploring `solution`, begin with `help`, `doctor`, `state`, and `trace`.
Use `help platforms` and `help performance` when you reach those exercises.
Compare your implementation with the example; copying its internal structure
or bridge name is not a requirement.

Sources: [CDP](https://chromedevtools.github.io/devtools-protocol/),
[React Profiler](https://react.dev/reference/react/Profiler),
[React Native debugging](https://reactnative.dev/docs/debugging).
