# First-use session

Purpose: find friction a maintainer cannot see. This is a facilitation protocol,
not a claim that independent attendees have already completed the exercise.

Invite three engineers who have not seen the implementation. Include someone
unfamiliar with Expo and someone who can try the iOS extension. Ask each to use
the public README, their usual agent, and their own machine. Share only the repo
link and the request: “Use the README to investigate the first reported bug.”
Don't provide the reference branch or answers unless they choose it themselves.

## Observe without coaching

Record elapsed time from opening the README to:

- Seeing the web app.
- Reproducing completion → refresh.
- Asking the agent to build a tool.
- Obtaining the first useful runtime observation from that tool.
- Explaining the disagreement with evidence and verifying a repair.

Record exact commands/errors at stalls and where they looked for help. Allow
participants to stop. Mark facilitator intervention explicitly; don't count a
coached run as independent success. Collect only what participants agree to share.

Suggested readiness goals, not measured claims: web startup within five minutes
on a machine with prerequisites; a useful observation within ten minutes after
startup; no maintainer intervention needed to find the example CLI. Time to fix
can vary with the participant's agent and should not be promised on stage.

## Session record

- Date / source commit / branch:
- OS / Node / browser / Expo familiarity / agent:
- Prerequisites installed before session:
- Startup / reproduction / first observation times:
- Exact prompt used:
- Useful observation and command:
- Stalls, errors, and requested help:
- Intervention supplied:
- Repair acceptance result and unavailable checks:
- Could the participant explain what the CLI added?
- Could they find and try `solution` without help?
- First documentation or code change suggested by this session:

Ask the participant to describe how they would apply the idea to their own app.
That transfer matters more than copying the reference commands. Fix repeated
friction before adding features. Keep completed, consented session summaries
separate from this blank protocol; maintainers' rehearsals are labeled separately.
