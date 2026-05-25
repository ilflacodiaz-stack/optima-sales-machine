# Optima Sales Machine Deployment

Optima Sales Machine now has a single deployable Node app:

```txt
tools/web-app.mjs
```

It serves:

- the dashboard at `/`
- the State API at `/health`, `/summary`, `/prospects`, `/research-briefs`, `/outreach-drafts`, and agent run endpoints
- static JSON state for local fallback/debugging

## Run Locally

```sh
cd optima-sales-machine
npm start
```

Then open:

```txt
http://127.0.0.1:8787/
```

If port `8787` is busy:

```sh
PORT=8899 HOST=127.0.0.1 npm start
```

Then open:

```txt
http://127.0.0.1:8899/
```

## Deploy To Render

Recommended first deployment because this project needs a persistent Node server.

1. Push the repository to GitHub.
2. In Render, create a new Web Service.
3. Use `optima-sales-machine` as the root directory.
4. Build command:

```sh
npm install
```

5. Start command:

```sh
npm start
```

6. Add environment variables only when needed:

```txt
NODE_VERSION=20
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
PUBLIC_WEBHOOK_URL=
```

`render.yaml` is included as a starting point.

## Deploy To Vercel

Vercel is the fastest option for a polished portfolio/demo URL.

Production URL:

```txt
https://optima-sales-machine.vercel.app/
```

Current Vercel mode:

```txt
Static dashboard demo
```

That means:

- the dashboard is hosted publicly
- bundled sanitized demo state loads from `/demo-state/*.json`
- mutating actions are disabled unless a production API/database is connected
- private local state in `/state` is excluded by `.vercelignore`

Deploy from this folder:

```sh
cd optima-sales-machine
vercel --prod
```

`vercel.json` rewrites `/` to `/dashboard.html`.

For a fully working Vercel app, add Supabase and point the dashboard at production API routes or an external API:

```txt
Dashboard on Vercel
  -> Vercel API routes or Render API
  -> Supabase
  -> OpenClaw scheduled worker
```

## Deploy To Railway

Railway is also a good fit for the same single Node app.

1. Create a new Railway project from GitHub.
2. Set the project root to `optima-sales-machine`.
3. Railway should detect `package.json`.
4. Start command:

```sh
npm start
```

5. Add secrets in Railway variables if Telegram or external integrations are enabled.

## What Changes Later

The current deployment stores state in local JSON files. That is fine for a portfolio demo and local usage, but production should move state to:

- Supabase for prospects, research briefs, outreach drafts, daily runs, and outcomes
- a scheduled worker for the daily OpenClaw sequence
- auth before exposing private prospect data publicly

Recommended production shape:

```txt
Dashboard web app
  -> Node API
  -> Supabase
  -> OpenClaw agents / scheduled worker
```
