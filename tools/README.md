# Tools

Tools are not agents. They perform bounded work that agents can call.

Useful tools for this system:

- portal discovery scraper
- website text extractor
- CRM signal detector
- duplicate checker
- state reader/writer
- Telegram sender

## First Tool To Build

Build or reuse a Scout discovery webhook:

```txt
POST /api/scout
input: source URL or search parameters
output: candidate inmobiliarias as structured JSON
```

The Scout Agent should use this tool, then reason over the results.

## Tool Output Should Be Boring

Return facts, not strategy.

Good:

```json
{
  "company_name": "Example Propiedades",
  "source_url": "https://...",
  "listing_count_estimate": 42,
  "location": "CABA",
  "contact_paths": ["website", "whatsapp"]
}
```

Bad:

```json
{
  "message": "This is a great lead and you should pitch them now"
}
```

The agent decides whether it is a great lead.

## Local State API

Run:

```sh
node optima-sales-machine/tools/state-api.mjs
```

The API writes to the same local JSON files as `state-cli.mjs`.

```txt
GET /health
GET /summary
GET /prospects?status=SCOUTED
POST /prospects
GET /research-briefs?status=QUALIFIED
POST /research-briefs
GET /outreach-drafts?status=OUTREACH_DRAFTED
POST /outreach-drafts
PATCH /outreach-drafts/:draft_id
POST /telegram-command
POST /telegram-webhook
POST /scout/run
POST /research/run
POST /outreach/run
POST /pipeline/run
```

Example:

```sh
curl -s http://127.0.0.1:8787/summary
```

Create a prospect:

```sh
curl -s http://127.0.0.1:8787/prospects \
  -H "content-type: application/json" \
  -d '{"company_name":"Example Propiedades","source":"manual","location":"CABA","why_flagged":"Visible WhatsApp lead flow"}'
```

Run Scout from a source file:

```sh
node optima-sales-machine/tools/scout-runner.mjs \
  --source=optima-sales-machine/sources/zonaprop-caba-candidates.json \
  --limit=3
```

Run James-style Research on newly scouted prospects:

```sh
node optima-sales-machine/tools/research-runner.mjs \
  --hints=optima-sales-machine/sources/james-research-hints.json \
  --limit=3
```

Run Outreach on qualified research briefs:

```sh
node optima-sales-machine/tools/outreach-runner.mjs --limit=3
```

Run the full daily multi-agent pipeline:

```sh
node optima-sales-machine/tools/daily-pipeline-runner.mjs \
  --scout-source=optima-sales-machine/sources/zonaprop-caba-candidates.json \
  --research-hints=optima-sales-machine/sources/james-research-hints.json \
  --limit=3
```

## Telegram Command Router

The Telegram command router can be tested locally before a bot token is connected:

```sh
node optima-sales-machine/tools/telegram-command-router.mjs /today
node optima-sales-machine/tools/telegram-command-router.mjs /prospects
node optima-sales-machine/tools/telegram-command-router.mjs /brief martin-pinus
node optima-sales-machine/tools/telegram-command-router.mjs /drafts martin-pinus
node optima-sales-machine/tools/telegram-command-router.mjs /approve martin-pinus-1779578959325
node optima-sales-machine/tools/telegram-command-router.mjs /reject martin-pinus-1779578959325
node optima-sales-machine/tools/telegram-command-router.mjs /mark_sent martin-pinus-1779578959325
node optima-sales-machine/tools/telegram-command-router.mjs /mark_replied martin-pinus-1779578959325
node optima-sales-machine/tools/telegram-command-router.mjs /follow_up martin-pinus-1779578959325
node optima-sales-machine/tools/telegram-command-router.mjs /meeting_booked martin-pinus-1779578959325
node optima-sales-machine/tools/telegram-command-router.mjs /not_interested martin-pinus-1779578959325
node optima-sales-machine/tools/telegram-command-router.mjs /note martin-pinus-1779578959325 "Asked for pricing next week"
node optima-sales-machine/tools/telegram-command-router.mjs /meeting_details martin-pinus-1779578959325 "Tuesday 10:00. Prep: lead triage demo."
```

Use `/reject` only when a draft should be revised. Use `/mark_sent` only after Alfonso actually sends the approved outreach. Use `/mark_replied` or `/follow_up` after the first send.

The State API also exposes the same router:

```sh
curl -s http://127.0.0.1:8787/telegram-command \
  -H "content-type: application/json" \
  -d '{"text":"/today"}'
```

## Telegram Webhook

`POST /telegram-webhook` accepts Telegram update payloads. If `TELEGRAM_BOT_TOKEN` is set, it sends the command response back to Telegram with `sendMessage`. If no token is set, it returns the reply JSON without sending.

Local webhook test:

```sh
curl -s http://127.0.0.1:8787/telegram-webhook \
  -H "content-type: application/json" \
  -d '{"message":{"message_id":1,"chat":{"id":123456},"text":"/today"}}'
```

Set real secrets outside git:

```sh
cp optima-sales-machine/.env.example optima-sales-machine/.env
```

Then fill:

```txt
TELEGRAM_BOT_TOKEN=<your bot token>
TELEGRAM_CHAT_ID=<your chat id>
PUBLIC_WEBHOOK_URL=<your public https endpoint>/telegram-webhook
```

To find your chat ID:

1. Send any message to the bot in Telegram.
2. Run:

```sh
node optima-sales-machine/tools/telegram-get-chat-id.mjs
```

To send today's summary directly:

```sh
node optima-sales-machine/tools/telegram-send-summary.mjs
```

Register the webhook:

```sh
node optima-sales-machine/tools/telegram-register-webhook.mjs
```
