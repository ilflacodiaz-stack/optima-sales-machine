# Optima Sales Machine

Sprint 4 multi-agent system: agents that work together to find, research, and prepare outreach for qualified inmobiliaria prospects.

## Goal

Open the Optima Sales Machine web app and see:

- new qualified inmobiliarias
- research briefs
- CRM / competitor signals
- WhatsApp, email, and LinkedIn first-touch drafts
- clear next action for your review

## System Shape

```txt
Scout Agent
  -> finds candidate inmobiliarias
  -> writes prospect records

Research Agent
  -> enriches prospect records
  -> writes research briefs and qualification scores

Outreach Agent
  -> turns briefs into channel-specific messages
  -> writes review-ready outreach drafts

Orchestrator
  -> runs the daily sequence
  -> prepares the daily review

You
  -> work from the dashboard: approve, edit, send, and track results
```

## Recommended First Version

Use shared-state orchestration, not direct agent-to-agent chat yet.

```txt
agents share state through files, Google Sheets, Supabase, or a small API
```

This is easier to debug and still counts as a real multi-agent system because each agent has a distinct role, input contract, output contract, tools, and decision boundary.

## Existing Agents To Reuse

You already have:

- James: research workflow agent
- Donna: daily summary / notification pattern
- Jimmy: existing Telegram/OpenClaw pattern

Recommended mapping:

- Keep James as the base for `Research Agent`.
- Reuse Donna's cron + Telegram delivery pattern for daily summaries.
- Reuse Jimmy/your Telegram setup pattern for the review interface.
- Build `Scout Agent` and `Outreach Agent` as new OpenClaw agents.

## Folder Map

```txt
agents/
  scout/SOUL.md
  research/SOUL.md
  outreach/SOUL.md

schemas/
  prospect.schema.json
  research-brief.schema.json
  outreach-draft.schema.json

docs/
  architecture.md
  implementation-plan.md
  existing-agent-integration.md
  case-study-template.md

tools/
  README.md
```

## Next Implementation Step

Pick the shared state store:

1. Google Sheets: fastest to inspect manually.
2. Supabase: best if you want a real product foundation.
3. Local JSON/CSV: fastest local prototype.

My recommendation for Sprint 4 is Google Sheets first, then Supabase after the workflow proves useful.

## Local Handoff Prototype

Run the deployable local app:

```sh
cd optima-sales-machine
npm start
```

Default URL:

```txt
http://127.0.0.1:8787/
```

This serves the dashboard and API from the same Node app, which is the deployment shape.

This repo now includes a local JSON state layer and CLI:

```sh
node optima-sales-machine/tools/state-cli.mjs summary
```

It also includes a small local state API for agents, Telegram commands, webhooks, or the dashboard:

```sh
node optima-sales-machine/tools/state-api.mjs
```

Default URL:

```txt
http://127.0.0.1:8787
```

Core endpoints:

```txt
GET /summary
GET /prospects?status=SCOUTED
POST /prospects
GET /research-briefs?status=QUALIFIED
POST /research-briefs
GET /outreach-drafts?status=OUTREACH_DRAFTED
POST /outreach-drafts
```

Run the first manual relay with:

```txt
docs/manual-handoff-runbook.md
```

Open the dashboard at:

```txt
http://127.0.0.1:4173/optima-sales-machine/dashboard.html
```

Or use the deployable app entrypoint:

```txt
http://127.0.0.1:8787/
```

The dashboard is the primary interface for the Sprint 4 portfolio version. It shows:

- Agent Command Center for Scout, James Research, Outreach, and Orchestrator
- pipeline metrics
- daily agent runs
- prospect list
- research briefs
- channel-specific outreach drafts
- approve/reject/send/reply/meeting controls

The dashboard can read static JSON state on its own. To add prospects from the dashboard form, also run:

```sh
node optima-sales-machine/tools/state-api.mjs
```

Send the current Telegram-style daily summary locally:

```sh
node optima-sales-machine/tools/telegram-command-router.mjs /today
```

Send it to the real Telegram bot once `.env` has `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`:

```sh
node optima-sales-machine/tools/telegram-send-summary.mjs
```

## OpenClaw Native Package

The OpenClaw-native agent package lives in:

```txt
optima-sales-machine/openclaw/
```

It defines:

- `Optima Scout Agent`
- `James Research Agent`
- `Optima Outreach Agent`
- `Optima Sales Orchestrator`

OpenClaw registration is complete for:

- `optima-scout`
- `optima-james-research`
- `optima-outreach`
- `optima-orchestrator`

The shared MCP server is registered as:

```txt
optima-sales-machine
```

The proof command is:

```sh
openclaw agent --agent optima-orchestrator --message "Use only the optima-sales-machine MCP tools. Call get_summary and reply with: MCP OK prospects=<count> ready_for_review=<count> meeting_booked=<count>." --json --timeout 90
```

Confirmed result:

```txt
MCP OK prospects=5 ready_for_review=3 meeting_booked=1
toolSummary.tools: optima-sales-machine__get_summary
```

Validate the package with:

```sh
node optima-sales-machine/openclaw/validate-openclaw-package.mjs
```
