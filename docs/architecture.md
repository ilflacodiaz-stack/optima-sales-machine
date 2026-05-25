# Architecture

## Core Principle

Agents should reason. Tools should execute concrete actions. State should make handoffs observable.

```txt
Agent = decides what to do next
Tool = performs one bounded action
State = records facts, status, and outputs
Orchestrator = triggers agents in order
```

## Agent Pipeline

```txt
Daily Cron
  -> Scout Agent
  -> Prospect State
  -> Research Agent
  -> Research State
  -> Outreach Agent
  -> Outreach State
  -> Telegram Daily Brief
```

## Scout Agent

Purpose:

Find inmobiliarias that match Optima's ideal customer profile.

Inputs:

- ICP rules
- known prospect list
- portal URLs or scraping tool output
- daily run date

Tools:

- web browsing
- Zonaprop / Argenprop scraper endpoint
- dedupe checker
- state writer

Outputs:

- `prospect` records
- rejection notes for candidates that did not qualify

Decision boundary:

Scout decides whether a company is worth researching. It does not write outreach.

## Research Agent

Purpose:

Enrich each new prospect and determine whether they are worth outreach.

Inputs:

- prospect record
- existing Sprint 2 research workflow
- website / portal / social data

Tools:

- James research workflow
- web browsing
- CRM detector
- competitor signal detector
- state writer

Outputs:

- research brief
- qualification score
- suggested outreach angle

Decision boundary:

Research decides the best angle and qualification. It does not write final messages.

## Outreach Agent

Purpose:

Draft personalized first-touch messages for qualified prospects.

Inputs:

- research brief
- channel rules
- Optima voice and offer

Tools:

- message templates
- Telegram delivery
- state writer

Outputs:

- WhatsApp draft
- email subject and body
- LinkedIn DM draft
- review notes

Decision boundary:

Outreach writes drafts for human review. It does not send cold outreach without approval.

## State Machine

```txt
NEW
  -> SCOUTED
  -> RESEARCH_PENDING
  -> RESEARCHED
  -> QUALIFIED
  -> OUTREACH_DRAFTED
  -> REVIEWED
  -> SENT
  -> REPLIED
  -> DEMO_BOOKED
  -> CLOSED
```

## Why Shared State First

Direct agent-to-agent communication is attractive, but harder to inspect.

Shared state gives you:

- observability
- retries
- manual correction
- easier debugging
- metrics for the final case study

Once the pipeline works, direct agent messages can be added as a second layer.
