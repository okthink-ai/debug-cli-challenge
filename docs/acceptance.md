# Verify the repair

Infrastructure tests and challenge acceptance answer different questions.
`npm test` and `npm run test:browser` should pass on both published branches.
The following acceptance checks describe intended product behavior and should
fail against the supplied bugs. They are deliberately outside the normal CI gate.

## Web behavior — automated

```sh
npx playwright install chromium
npm run accept
```

This starts isolated test services automatically. It checks:

1. Completion survives a server read, UI refresh, and a fresh page load.
2. With highlighting enabled, draft-only typing leaves unchanged row indicators
   idle. The draft still changes to the exact input text.

The second check watches the existing React-effect-driven visual indicator. It
is a check of the user-visible symptom, not a React timing or CPU measurement.
Keep that indicator functional while fixing the app. Use your CLI to capture
actual React commits and verify that changed tasks still update.

Failures produce screenshots and Playwright traces in `test-results/`. Two
failures are expected on an untouched checkout. Do not change the expected
behavior to make the broken app pass.

## iOS behavior — real input

Start the app in the simulator using [setup](setup.md), reset the sample data,
and reload both clients. Add a high-priority task on web and iOS. Both should
succeed and create matching persisted rows. Cold-start iOS and repeat.

If [Maestro](https://docs.maestro.dev/) is installed and one simulator is booted,
you can automate the native submission against the running SDK 55 Expo Go app:

```sh
npm run accept:ios
```

Start with an empty draft. This flow uses real native input and asserts success;
it intentionally fails on the untouched challenge. Use your CLI to inspect the
matching request and SQLite row afterward. The flow alone doesn't verify data
migration or persistence across a restart.

## React measurements — use your observation tool

Use 120 tasks and `Rehearse`. Focus/clear the draft, disable highlights, and let
the initial render settle before capture. Repeat the same input method before
and after your repair. Record the platform, build, fixture, row commits, and
screen render durations. Draft-only edits should leave unchanged rows alone.
Check adding, toggling, and refreshing afterward.

The reference implementation on `solution` supplies `perf-type` for real web
keystrokes and `perf-start` / `perf-stop --target ios` around native typing.
Your own tool may use a different bridge or interface. Passing web tests does
not certify native behavior, React timings, production latency, or frame rate.
