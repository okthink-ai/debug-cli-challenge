# Local setup

Start with the four commands in the README. Web is the supported first exercise;
iOS is an extension, not a prerequisite for learning to build an observation tool.

## What runs

| Component | Address / file |
| --- | --- |
| Metro and web | http://localhost:8087 |
| Node HTTP backend | http://127.0.0.1:4310 |
| Embedded SQLite database | `.data/todos.sqlite` |
| Reference CLI's Chrome inspector | http://127.0.0.1:9337 |

`npm run dev` starts the API and Metro together. Keep that terminal running.
SQLite runs inside Node through `node:sqlite`; no SQLite daemon is required.

If a port is occupied, stop the earlier demo process. Don't silently accept a
second Metro port: both clients and the reference CLI should inspect the same app.
Errors about `node:sqlite` or `--env-file-if-exists` usually mean Node is too old.
Use Node 22.13 or newer. The CI workflow uses Node 24.

## iOS Simulator extension

Install Xcode, open an iPhone simulator, and press **i** in the Expo terminal.
Expo CLI can install the compatible simulator client. This repo pins **Expo
SDK 55**; use matching Expo Go or a matching development build.

If the combined terminal is not interactive, stop it, then run these in two
terminals:

```sh
npm run server
npm run ios
```

Reopen the running app in an already installed Expo Go client:

```sh
xcrun simctl openurl booted exp://127.0.0.1:8087
```

For a cold restart, terminate Expo Go before reopening the URL:

```sh
xcrun simctl terminate booted host.exp.Exponent
xcrun simctl openurl booted exp://127.0.0.1:8087
```

Use the actual native app; resizing Chrome doesn't reproduce native storage or
lifecycle. In the scenario, an existing installation opens after the server's
priority settings changed. The fixture restores that historical installation
for each new run. See [the supplied fixtures](exercise.md#what-is-already-supplied).

A physical phone needs the Mac's LAN address: copy `.env.example` to `.env`, set
`EXPO_PUBLIC_API_URL` and `DEMO_API_HOST` as shown, then restart Metro. The phone
and Mac must share a network. Simulator loopback defaults need no `.env`.

## Reference debug browser

On `solution`, `npm run debug -- browser` launches Chrome with a separate profile
under `.data/chrome` and inspector port 9337. It defaults to macOS's normal
Chrome path. On Linux or Windows, set `CHROME_PATH` to the full executable path
in your shell before running it. You can also start Chrome manually with
`--remote-debugging-port=9337` and a separate `--user-data-dir`.

Close duplicate debug tabs. The CLI refuses ambiguous targets. Run
`npm run debug -- doctor` to check attachment; open the app before asking the
agent to inspect it. Close React Native DevTools if it competes for the Hermes
connection. The inspector is a local development facility.

## Resets and branch switching

`npm run reset` replaces the sample tasks and request history with a new fixture
run. Reload both clients afterward. It doesn't undo code changes.

Before switching branches, commit your changes on a working branch and stop the
dev server. Switch, run `npm ci` when dependencies changed, restart, and reload
both clients. A stale runtime can retain the previous branch's bridge.

## Development checks

```sh
npm test
npm run type-check
npm run lint
npm run format:check
npm run build:web
npx playwright install chromium
npm run test:browser
```

Browser tests start their own API and Metro on ports **4311 / 8089**, use a
separate SQLite file, and stop the processes afterward. They do not reset a
running demo on 4310. CI installs Chromium and runs the same smoke checks.
Use `npm run format` to format source. [Repair acceptance](acceptance.md) is separate.

Sources: [Expo Go](https://docs.expo.dev/get-started/set-up-your-environment/),
[Chrome inspector profiles](https://developer.chrome.com/blog/remote-debugging-port),
[Playwright web servers](https://playwright.dev/docs/test-webserver).
