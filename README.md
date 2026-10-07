# Debug CLI Challenge

**Give your coding agent a way to see what the app is actually doing.**

Little List is a deliberately broken todo app: one Expo / React Native frontend
for web and iOS, a local Node HTTP backend, and a real SQLite database. Your
challenge is to build a product-specific debug CLI, use it to explain three
bugs with runtime evidence, and then fix them.

Check it out, fork it, and try this with your favorite coding agent:

> **Try asking your agent to create a debug CLI that uses the CDP protocol to
> debug these apps.** Start with observation commands for web and iOS, trace a
> request through the frontend, backend, and SQLite, and measure React rendering
> while I type. Reproduce the problems before changing application behavior.
> Then use the CLI to diagnose, fix, and verify each problem.

This exercise was created for Rafael Mendiola's okthink talk **Give Your Agents
Perception**. The talk's premise: an agent can read code and still lack the
observations it needs to debug a running product. A small CLI can give it those
observations in a repeatable, inspectable form. This is a teaching app with
synthetic data, not a production todo service. The presentation repository is
[debug-cli-presentation](https://github.com/dslounge/debug-cli-presentation)
(access may depend on that repository's visibility). Everything needed for this
challenge is here; the presentation framework is not a dependency.

## Choose your starting point

| Branch | What you get | What you do |
| --- | --- | --- |
| **`main` (default)** | Broken app, seed/reset utility, ordinary request records, visual render flashes. No product debug CLI or runtime bridge. | Build your own CLI, then diagnose and repair the app. |
| **[`solution`](https://github.com/okthink-ai/debug-cli-challenge/tree/solution)** | The same broken app, plus a reference CLI, development runtime bridge, and React profiler collector. | Ask your agent to use the supplied tools to diagnose and repair the app. |

**`solution` solves the tooling exercise, not the app bugs.** Neither branch has
a fixed mode or a hidden switch that repairs the app. Make your fixes on your
own branch. The main branch's history does not contain the reference CLI.

## The three problems

### 1. Across the stack: “saved” does not survive refresh

Complete **Send the launch checklist**. The checkbox checks and the app says
“Completed · saved.” Press **Refresh**: it becomes incomplete again.

Explain what the frontend intended, what the HTTP response acknowledged, what
the server executed, and what SQLite actually persisted. A screenshot or an HTTP
200 alone cannot settle this. After your fix, completion must survive a refresh
and a client restart, and the database must agree.

### 2. Between platforms: adding works on web, fails on iOS

On a fresh fixture, type a task and press **Add task** in both clients. Both
composers say **High priority**. Web adds the task; iOS reports a priority error.

Compare the actual running clients, their restored state, and the requests they
send to the same backend. Do not substitute a phone-sized browser for iOS. After
your fix, both clients must create the intended task, including after a native
cold restart. Keep server validation meaningful.

### 3. React Native performance: typing redraws the task list

Wait for the initial orange outlines to fade, then type into the composer
without submitting. The unchanged rows flash again with each character. The
same React Native component tree drives the browser and the iOS app.

The fixture has 120 tasks and synthetic activity history to make unnecessary
work observable. Measure which components commit and the work they do. After
your fix, draft-only edits should leave unchanged rows alone while adding,
completing, and refreshing tasks still work. Verify iOS as well as web.

The orange outline is a **React commit indicator**, driven by an effect; it is
not a GPU repaint meter. Turn it off for comparable numerical profiling. React
render duration, JavaScript CPU samples, input latency, and native frame rate
are different measurements—label your evidence accordingly.

## Run locally

Use **Node 22.13+** (Node 24 LTS recommended) and npm. No cloud accounts, API keys,
Docker, or hosted database are needed. Web works on macOS, Linux, and Windows;
the iOS Simulator requires macOS and Xcode.

```sh
git clone https://github.com/okthink-ai/debug-cli-challenge.git
cd debug-cli-challenge
npm ci
npm run dev
```

This starts Metro/web on **http://localhost:8087** and the local API on
**http://127.0.0.1:4310**. Leave it running. SQLite is embedded in the Node backend
using `node:sqlite`, with its file at **`.data/todos.sqlite`**. There is no separate
SQLite daemon to install. A first run seeds the database automatically.

### iOS Simulator

Install Xcode and an iOS Simulator, then press **i** in the Expo terminal.
`npm run dev` uses an interactive Expo child when run in a normal terminal.
Alternatively, with the backend already running, stop the combined command and
run these in separate terminals:

```sh
npm run server
npm run ios
```

Use Expo Go compatible with **Expo SDK 55**, the version pinned by this repo.
Expo CLI can install the compatible simulator client. Both platforms must use
the same Metro instance (8087) and backend (4310); do not accept a second Metro
port when one is already running. In an installed Expo Go simulator client you
can reopen the running app with:

```sh
xcrun simctl openurl booted exp://127.0.0.1:8087
```

On a physical iPhone, use a compatible Expo Go or development build, put the
phone and Mac on the same LAN, and follow `.env.example`: set
`EXPO_PUBLIC_API_URL` to the Mac's LAN address and `DEMO_API_HOST=0.0.0.0`. Restart
Metro after changing public environment variables. Loopback on a phone refers
to the phone itself. The simulator loopback defaults need no `.env` file.

### Reset between attempts

```sh
npm run reset
# Optional task count, 8–300:
npm run reset -- 120
```

This deletes sample tasks/request history and creates a new fixture run ID.
**Reload both clients afterward** (browser reload and Expo reload/cold start).
Each run starts iOS with the same historical local preference so the platform
problem is reproducible. Reset seeds inputs; it never changes application code
or undoes your fixes. The same run ID helps detect stale clients.

## Build the observation surface

Start from the symptoms, not from a guessed patch. Useful commands might be:

- `doctor`: identify the app, platform, runtime, backend, and fixture you attached to.
- `state` / `compare`: compare live web and native state with explicit target identity.
- `trace <request-id>`: join client intent, HTTP result, server execution, and a fresh database read.
- `perf-start` / `perf-stop`: collect React commits around real input, with raw evidence.

Chrome exposes browser targets through CDP; Metro exposes the native Hermes
inspector targets through `/json/list` on its development port. The protocol is
a transport, not an automatic product-state or React-metrics API. You may need
a small development-only bridge and React `<Profiler>` callbacks. A browser
CPU profile alone does not give you React component commit counts.

Use a separate Chrome profile for remote debugging. Native Hermes supports a
subset of CDP; browser DOM commands do not operate on native views. Use real
taps/manual typing or a native driver such as Maestro for native interactions.
Keep inspector ports local. Give commands bounded timeouts and useful JSON;
report missing evidence as **unknown**, not success.

Raw building blocks already present: request IDs, bounded client request records,
`GET /__demo/requests` server records, fixture run IDs, and a local SQLite file.
These are breadcrumbs; `main` does not contain a CLI that joins them or a global
runtime bridge. You are welcome to change the instrumentation and tool design.

See [the demo flow](docs/demo-flow.md) for a rehearsal/workshop sequence and
[the reference branch](https://github.com/okthink-ai/debug-cli-challenge/tree/solution)
when you want to compare approaches.

Sources: [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/),
[Chrome remote-debugging profiles](https://developer.chrome.com/blog/remote-debugging-port),
[React Native debugging](https://reactnative.dev/docs/debugging),
[React Profiler](https://react.dev/reference/react/Profiler).

## Checks and project map

```sh
npm test
npm run type-check
npm run lint
npm run build:web
# With npm run dev running (smoke test adds one sample task):
npx playwright install chromium
npm run test:browser
```

These are infrastructure and ordinary-functionality checks. Passing them does
**not** mean the three challenge bugs are fixed. Add regression tests as you
solve the problems, and use runtime evidence to verify the same user actions.

| Path | Responsibility |
| --- | --- |
| `App.tsx` | Shared React Native UI and row commit flashes |
| `src/store.ts` | Client state, restored settings, and HTTP requests |
| `server/` | Node HTTP API, SQLite schema, and deterministic fixture |
| `scripts/` | Local development, reset, and browser smoke check |
| `docs/demo-flow.md` | What to show and what each observation should establish |

Share your approach in an issue or PR: the CLI interface, a short reproduction,
raw before/after evidence, the repair, and the limits of what you verified.
Different tool designs are welcome. The goal is an agent that can investigate
and verify the product, not just guess a plausible code edit.

MIT licensed. No private okthink packages are required.
