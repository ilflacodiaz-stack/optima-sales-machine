# Manual Handoff Runbook

Use this before connecting automation. It proves the multi-agent relay works.

## 1. Scout Creates A Prospect

```sh
node optima-sales-machine/tools/state-cli.mjs add-prospect --company="Example Propiedades" --source="manual" --location="CABA" --listing-count=35 --contacts="website,whatsapp" --why="Looks active on portals and has visible contact paths"
```

## 2. Research Agent Reads The Prospect

```sh
node optima-sales-machine/tools/state-cli.mjs list prospects
```

Send one `SCOUTED` prospect to the Research Agent using the adapted `agents/research/SOUL.md`.

## 3. Save The Research Brief

```sh
node optima-sales-machine/tools/state-cli.mjs add-research --prospect-id="example-propiedades" --company="Example Propiedades" --score=82 --summary="Active CABA inmobiliaria with visible portal activity." --crm="No CRM detectable" --pain="Manual WhatsApp follow-up|No visible lead qualification" --angle="Improve portal lead response and qualification"
```

## 4. Outreach Agent Drafts Messages

Send the qualified research brief to `agents/outreach/SOUL.md`.

## 5. Save The Outreach Draft

```sh
node optima-sales-machine/tools/state-cli.mjs add-outreach --prospect-id="example-propiedades" --company="Example Propiedades" --angle="Improve portal lead response and qualification" --whatsapp="Hola, ¿cómo estás? Vi que tienen bastante movimiento en CABA y quería preguntarte cómo están manejando las consultas que entran por portales. En Optima estamos ayudando a inmobiliarias a responder, calificar y ordenar esos leads automáticamente. ¿Te sirve que te muestre un ejemplo corto?" --email-subject="Consulta por leads de portales" --email-body="Hola, ¿cómo estás? Vi actividad de Example Propiedades en CABA y quería acercarte una idea concreta para mejorar la respuesta a consultas de portales. En Optima implementamos agentes de IA para responder, calificar y ordenar leads antes de pasarlos al asesor. Si te interesa, te puedo mostrar un ejemplo aplicado a inmobiliarias." --linkedin="Hola, vi Example Propiedades y me pareció interesante el movimiento que tienen en CABA. Estoy trabajando en Optima con agentes de IA para inmobiliarias, enfocados en respuesta y calificación de leads. ¿Te puedo compartir un ejemplo breve?"
```

## 6. Check The Morning Summary Numbers

```sh
node optima-sales-machine/tools/state-cli.mjs summary
```
