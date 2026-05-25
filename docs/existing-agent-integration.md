# Existing Agent Integration

You already have working OpenClaw + Telegram agents. The next step is to reuse their proven patterns instead of inventing everything again.

## James -> Research Agent

Use `lead-intelligence` as the base for the Research Agent.

Keep:

- investigative style
- web research workflow
- webhook/tool calling pattern
- Telegram interaction pattern
- Spanish Argentina / voseo
- CRM and competitor detection checklist
- strict "do not invent data" rule

Add:

- input contract: reads a `prospect` record
- output contract: writes a `research_brief`
- qualification score
- outreach angle

## Optima Prospect Tracker -> Daily Summary Pattern

Use `Optima Prospect Tracker` as the reporting and pipeline-summary pattern.

Keep:

- cron wake-up
- concise daily message
- Telegram delivery
- urgent / today / pipeline grouping
- short Argentine Spanish tone

Add:

- number of prospects found
- number researched
- number qualified
- drafts waiting for review
- blockers or low-confidence items

## Jimmy -> Telegram Interface Pattern

Use your existing Telegram setup as the review interface pattern.

Possible commands:

```txt
/today
/prospects
/brief <prospect_id>
/approve <draft_id>
/reject <draft_id>
/mark_sent <draft_id>
/reply <prospect_id>
```

## What I Need From Your Existing Agents

Copied into this project:

- `agents/research/LEAD_INTELLIGENCE_ORIGINAL_SOUL.md`
- `agents/OPTIMA_ORIGINAL_SOUL.md`
- `agents/DJ_TRACKER_ORIGINAL_SOUL.md`
- `agents/MAIN_ORIGINAL_SOUL.md`

Still useful if available:

- current Vercel webhook code
- current Telegram command format
- where prospect data currently lives, if anywhere

Then we can adapt instead of guessing.

## Security Note

One copied agent file appears to include a YouTube API key in plain text. It is unrelated to this Sprint 4 system, but if that key is real, rotate it and move future keys into environment variables.
