# Debug CLI Challenge

Read README.md first. Read docs/exercise.md when starting an investigation. This is a standalone Expo project.

The default branch intentionally contains three bugs. When asked to build tools,
preserve those symptoms while adding observation. When asked to solve the
challenge, you are authorized to fix them; do not preserve bugs against that
request. There are no prepared repair switches.

Use actual runtime observations to establish a baseline before editing a suspected
cause. Join frontend/backend/database evidence with request ID and fixture run ID.
Missing evidence is unknown. A successful HTTP response is not proof of persistence.

Use real browser input or native taps (manual or Maestro) to verify interactions.
Calling a store action through CDP is not a native tap. Separate React render
measurements from JavaScript CPU samples, input latency, and native paint.

Keep the project independent of private packages and the presentation framework.
Keep secrets, local databases, browser profiles, and generated artifacts ignored.
Use separate TypeScript type imports. Run npm test, npm run type-check,
npm run lint, and npm run build:web after app/tool changes. Use real UI checks for
behavioral changes. Record unavailable platforms honestly. Commit completed work.
