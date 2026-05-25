# Immediate Next Step

The best next step is to implement shared state and run the first manual handoff.

## Why

Your Research Agent already exists as `lead-intelligence`. We do not need to rebuild it first.

The missing system piece is the handoff:

```txt
Scout creates prospect -> Research reads prospect -> Outreach reads brief
```

## Recommended Manual Test

Before connecting scrapers, run one prospect through the system manually.

1. Add one inmobiliaria prospect to shared state.
2. Ask Research Agent to process that prospect using the adapted `research/SOUL.md`.
3. Save the research brief.
4. Ask Outreach Agent to draft WhatsApp, email, and LinkedIn messages.
5. Send yourself the output in Telegram.

## State Choice

Start with Google Sheets if you want the fastest operational Sprint 4.

Minimum tabs:

- `prospects`
- `research_briefs`
- `outreach_drafts`
- `daily_runs`

## If You Want Local First

Use JSON files in this repo:

```txt
state/prospects.json
state/research_briefs.json
state/outreach_drafts.json
state/daily_runs.json
```

Local JSON is easier for coding here. Google Sheets is easier for you to inspect on your phone.

## Built Next

A small state API now exists at `tools/state-api.mjs`:

```txt
POST /prospects
GET /prospects?status=SCOUTED
POST /research-briefs
GET /research-briefs?status=QUALIFIED
POST /outreach-drafts
```

This can later be called by OpenClaw, Vercel webhooks, Telegram bots, or a dashboard.

## Next Best Action

Connect one interface to the API:

- Telegram `/today` can call `GET /summary`.
- Telegram `/prospects` can call `GET /prospects?status=SCOUTED`.
- The dashboard can later switch from direct JSON fetches to the API.
