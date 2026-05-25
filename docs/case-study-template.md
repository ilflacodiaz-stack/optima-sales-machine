# Case Study Template

## Title

How I built a multi-agent sales machine for Optima

## Context

Manual prospecting was slow because each lead required:

- finding candidate inmobiliarias
- checking whether they fit the ICP
- researching their current digital/CRM setup
- writing personalized outreach
- tracking outcomes

## System

I built three agents:

- Scout Agent: finds new prospects
- Research Agent: enriches and qualifies them
- Outreach Agent: drafts personalized messages

## Architecture

```txt
Scout -> Shared State -> Research -> Shared State -> Outreach -> Telegram Review
```

## Metrics

| Metric | Manual Baseline | Agent-Assisted |
| --- | ---: | ---: |
| Prospects found per week |  |  |
| Qualified prospects per week |  |  |
| Research time per prospect |  |  |
| Messages drafted per week |  |  |
| Replies |  |  |
| Demos booked |  |  |

## Results

What improved:

- 

What still needed human judgment:

- 

Where the agents failed:

- 

## Lessons Learned

- 

## Next Version

- direct agent-to-agent handoffs
- Supabase dashboard
- automatic enrichment retries
- approval-based sending
- CRM integration
