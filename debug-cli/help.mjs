const common = `
Results are compact JSON. --full prints complete evidence; --out file.json
saves complete evidence without expanding the terminal output (.gz supported).
Exit 0=observation/pass, 1=observed failure, 2=unknown/unavailable/invalid input.
`;
const topics = {
  start: `Debug CLI Challenge — begin with one observation

  doctor [--target web|ios]       Check the target and backend connection
  state [--task task-001]         Current settings, task counts, latest request
  trace <request-id|last>         Follow one write from client to SQLite

First open the app: npm run debug -- browser
Then reproduce completion → refresh and inspect trace last.
Both branches retain the app bugs; this branch supplies example tools.

Continue when ready:
  help platforms                 Compare web and actual iOS
  help performance               Measure React commits around typing
  help tools                     Browser, reset, raw records, screenshots
  help all                       Full command reference`,
  platforms: `Platform comparison

  doctor --target ios            Check the real Hermes runtime
  state --target ios             Read the same product state on native
  compare                        Compare initialized web/iOS priority contracts
  trace last --target ios        Inspect a real native submission

Open the SDK 55 app in iOS Simulator first. A phone-sized browser is still web.
Use real taps or Maestro for interaction; a store action is not a native tap.`,
  performance: `React rendering

  perf-type [text] [--flash]      Real web keys + React events + CDP CPU profile
  perf-start [--target ios]       Begin a React capture after highlights settle
  perf-stop [--target ios]        Summarize the capture

Use 120 tasks and Rehearse. Highlights are disabled before capture unless
--flash is supplied. The UI switch shows the actual setting. Focus and clear
the native draft before starting, then type manually or with Maestro.
Captures last at most 60 seconds. React durations are not native paint times.`,
  tools: `Setup and supporting observations

  browser                        Launch Chrome with a separate profile (9337)
  reset [--count 120]             Replace sample data; reload both clients
  reload [--target web|ios]       Initialize via app action, not a cold restart
  requests [--target web|ios]     Summarize the latest five client requests
  server                         Backend identity and latest five SQL records
  database [task-id]              Read SQLite independently in read-only mode
  screenshot --out file.png      Capture web pixels

state --full returns the full snapshot; --task selects a task in a summary.
DEMO_CDP, DEMO_METRO, DEMO_TARGET_ID, DEMO_API_URL, DEMO_DB and CHROME_PATH
can override local defaults. See docs/setup.md and docs/debug-cli.md.`,
};
export function help(topic = 'start') {
  if (topic === 'all') return Object.values(topics).join('\n\n') + common;
  if (!topics[topic]) throw new Error(`Unknown help topic: ${topic}`);
  return topics[topic] + common;
}
