# OpenClaw Native Package

This folder turns Optima Sales Machine into an OpenClaw-native multi-agent system.

## Agent Team

```txt
Scout Agent
  -> finds and writes SCOUTED prospects

James Research Agent
  -> researches SCOUTED prospects
  -> writes QUALIFIED / REJECTED research briefs

Outreach Agent
  -> drafts WhatsApp, email, and LinkedIn messages
  -> writes OUTREACH_DRAFTED records

Optima Orchestrator
  -> runs the daily sequence
  -> sends Donna-style summaries
  -> exposes review commands
```

## Shared Tool Layer

All agents talk to the same project state through the OpenClaw MCP server:

```txt
optima-sales-machine
```

The bridge lives here:

```txt
openclaw/optima-state-mcp.mjs
```

It exposes tools like:

- `get_summary`
- `list_prospects`
- `run_scout`
- `run_research`
- `run_outreach`
- `run_pipeline`
- `telegram_command`

The browser dashboard also talks to the local State API:

```txt
http://127.0.0.1:8787
```

Start it from the project root:

```sh
node optima-sales-machine/tools/state-api.mjs
```

## Installed OpenClaw Agents

These agents are registered in OpenClaw:

- `optima-scout`
- `optima-james-research`
- `optima-outreach`
- `optima-orchestrator`

Smoke test:

```sh
openclaw agent --agent optima-orchestrator --message "Use only the optima-sales-machine MCP tools. Call get_summary and reply with: MCP OK prospects=<count> ready_for_review=<count> meeting_booked=<count>." --json --timeout 90
```

Expected proof:

```txt
toolSummary.tools includes optima-sales-machine__get_summary
```

## Agent Package Layout

Each agent folder contains:

- `agent.json`: OpenClaw-facing agent metadata and allowed tools.
- `SOUL.md`: the agent behavior, role, boundaries, and output contract.

## Workflow

The orchestrated daily workflow is defined in:

```txt
workflows/daily-sales-machine.json
```

Local equivalent:

```sh
node optima-sales-machine/tools/daily-pipeline-runner.mjs \
  --scout-source=optima-sales-machine/sources/zonaprop-caba-candidates.json \
  --research-hints=optima-sales-machine/sources/james-research-hints.json \
  --limit=3
```

## Definition Of Done

OpenClaw-native build is done when:

- [x] OpenClaw can load these four agents.
- [x] Anthropic auth works for the agents.
- [x] OpenClaw can load the `optima-sales-machine` MCP tools.
- [x] Orchestrator can call the shared state through MCP.
- [x] Scout -> James Research -> Outreach exists as a runnable pipeline.
- [x] Agent outputs land in shared state.
- [x] Telegram-style commands can review and update draft status through the local router.
- [ ] A real Telegram bot/webhook sends daily summaries without Codex manually running tools.
- [ ] A scheduler runs the daily OpenClaw workflow automatically.
