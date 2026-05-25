import { createServer } from "node:http";
import { runDailyPipeline } from "./daily-pipeline-runner.mjs";
import { runOutreach } from "./outreach-runner.mjs";
import { runResearch } from "./research-runner.mjs";
import { runScout } from "./scout-runner.mjs";
import { routeCommand } from "./telegram-command-router.mjs";
import { handleTelegramUpdate } from "./telegram-webhook.mjs";
import {
  appendRecord,
  buildOutreachDraft,
  buildProspect,
  buildResearchBrief,
  getSummary,
  listRecords,
  updateRecord
} from "./state-store.mjs";

const port = Number(process.env.PORT || 8787);

const routes = {
  "/prospects": {
    kind: "prospects",
    build: buildProspect
  },
  "/research-briefs": {
    kind: "research",
    build: buildResearchBrief
  },
  "/outreach-drafts": {
    kind: "outreach",
    build: buildOutreachDraft
  }
};

export function sendJson(response, status, body) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body, null, 2));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function getFilters(searchParams) {
  return {
    status: searchParams.get("status") || undefined,
    prospect_id: searchParams.get("prospect_id") || undefined
  };
}

export async function handleRequest(request, response) {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "OPTIONS") {
      sendJson(response, 204, {});
      return;
    }

    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { ok: true, service: "optima-state-api" });
      return;
    }

    if (request.method === "GET" && url.pathname === "/summary") {
      sendJson(response, 200, await getSummary());
      return;
    }

    if (request.method === "GET" && url.pathname === "/runs") {
      sendJson(response, 200, await listRecords("runs", getFilters(url.searchParams)));
      return;
    }

    if (request.method === "POST" && url.pathname === "/telegram-command") {
      const body = await readBody(request);
      const text = body.text || body.message || "";
      sendJson(response, 200, { text: await routeCommand(text) });
      return;
    }

    if (request.method === "POST" && url.pathname === "/telegram-webhook") {
      sendJson(response, 200, await handleTelegramUpdate(await readBody(request)));
      return;
    }

    if (request.method === "POST" && url.pathname === "/scout/run") {
      const body = await readBody(request);
      sendJson(response, 200, await runScout({
        sourcePath: body.source || body.source_path,
        limit: Number(body.limit || 3)
      }));
      return;
    }

    if (request.method === "POST" && url.pathname === "/research/run") {
      const body = await readBody(request);
      sendJson(response, 200, await runResearch({
        hintsPath: body.hints || body.hints_path,
        limit: Number(body.limit || 3)
      }));
      return;
    }

    if (request.method === "POST" && url.pathname === "/outreach/run") {
      const body = await readBody(request);
      sendJson(response, 200, await runOutreach({
        limit: Number(body.limit || 3)
      }));
      return;
    }

    if (request.method === "POST" && url.pathname === "/pipeline/run") {
      const body = await readBody(request);
      sendJson(response, 200, await runDailyPipeline({
        scoutSource: body.scout_source || body.scoutSource,
        researchHints: body.research_hints || body.researchHints,
        limit: Number(body.limit || 3)
      }));
      return;
    }

    const outreachDraftMatch = url.pathname.match(/^\/outreach-drafts\/([^/]+)$/);
    if (request.method === "PATCH" && outreachDraftMatch) {
      const draftId = decodeURIComponent(outreachDraftMatch[1]);
      const body = await readBody(request);
      sendJson(response, 200, await updateRecord("outreach", "draft_id", draftId, body));
      return;
    }

    const route = routes[url.pathname];
    if (!route) {
      sendJson(response, 404, {
        error: "Not found",
        endpoints: [
          "GET /health",
          "GET /summary",
          "GET /runs",
          "GET /prospects?status=SCOUTED",
          "POST /prospects",
          "GET /research-briefs?status=QUALIFIED",
          "POST /research-briefs",
          "GET /outreach-drafts?status=OUTREACH_DRAFTED",
          "POST /outreach-drafts",
          "PATCH /outreach-drafts/:draft_id",
          "POST /telegram-command",
          "POST /telegram-webhook",
          "POST /scout/run",
          "POST /research/run",
          "POST /outreach/run",
          "POST /pipeline/run"
        ]
      });
      return;
    }

    if (request.method === "GET") {
      sendJson(response, 200, await listRecords(route.kind, getFilters(url.searchParams)));
      return;
    }

    if (request.method === "POST") {
      const record = route.build(await readBody(request));
      sendJson(response, 201, await appendRecord(route.kind, record));
      return;
    }

    sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(response, 400, { error: error.message });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const host = process.env.HOST || "127.0.0.1";
  createServer(handleRequest).listen(port, host, () => {
    process.stdout.write(`Optima state API listening on http://${host}:${port}\n`);
  });
}
