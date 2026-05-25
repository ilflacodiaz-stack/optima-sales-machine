import {
  appendRecord,
  buildOutreachDraft,
  buildProspect,
  buildResearchBrief,
  getSummary,
  listRecords,
  updateRecord
} from "../tools/state-store.mjs";
import { runDailyPipeline } from "../tools/daily-pipeline-runner.mjs";
import { runOutreach } from "../tools/outreach-runner.mjs";
import { runResearch } from "../tools/research-runner.mjs";
import { runScout } from "../tools/scout-runner.mjs";
import { routeCommand } from "../tools/telegram-command-router.mjs";
import { appendFileSync } from "node:fs";

const debugLogPath = "/tmp/optima-state-mcp.log";

function debug(message) {
  if (!process.env.OPTIMA_MCP_DEBUG) return;
  appendFileSync(debugLogPath, `${new Date().toISOString()} ${message}\n`);
}

debug("server-start");

const tools = [
  {
    name: "get_summary",
    description: "Read Optima Sales Machine pipeline metrics.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "list_prospects",
    description: "List prospect records.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string" },
        prospect_id: { type: "string" }
      }
    }
  },
  {
    name: "create_prospect",
    description: "Create a prospect record.",
    inputSchema: {
      type: "object",
      properties: {
        company_name: { type: "string" },
        source: { type: "string" },
        source_url: { type: "string" },
        location: { type: "string" },
        listing_count_estimate: { type: "number" },
        contact_paths: { type: "array", items: { type: "string" } },
        why_flagged: { type: "string" },
        confidence: { type: "string" }
      },
      required: ["company_name"]
    }
  },
  {
    name: "list_research_briefs",
    description: "List research brief records.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string" },
        prospect_id: { type: "string" }
      }
    }
  },
  {
    name: "create_research_brief",
    description: "Create a research brief record.",
    inputSchema: { type: "object", additionalProperties: true }
  },
  {
    name: "list_outreach_drafts",
    description: "List outreach draft records.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string" },
        prospect_id: { type: "string" }
      }
    }
  },
  {
    name: "create_outreach_draft",
    description: "Create an outreach draft record.",
    inputSchema: { type: "object", additionalProperties: true }
  },
  {
    name: "update_outreach_draft",
    description: "Update an outreach draft by draft_id.",
    inputSchema: {
      type: "object",
      properties: {
        draft_id: { type: "string" },
        updates: { type: "object" }
      },
      required: ["draft_id", "updates"]
    }
  },
  {
    name: "run_scout",
    description: "Run Scout from a source file.",
    inputSchema: {
      type: "object",
      properties: {
        source: { type: "string" },
        limit: { type: "number" }
      },
      required: ["source"]
    }
  },
  {
    name: "run_research",
    description: "Run James-style Research on SCOUTED prospects.",
    inputSchema: {
      type: "object",
      properties: {
        hints: { type: "string" },
        limit: { type: "number" }
      }
    }
  },
  {
    name: "run_outreach",
    description: "Run Outreach on QUALIFIED research briefs.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" }
      }
    }
  },
  {
    name: "run_pipeline",
    description: "Run Scout -> Research -> Outreach.",
    inputSchema: {
      type: "object",
      properties: {
        scout_source: { type: "string" },
        research_hints: { type: "string" },
        limit: { type: "number" }
      },
      required: ["scout_source"]
    }
  },
  {
    name: "telegram_command",
    description: "Run Telegram-style command router.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" }
      },
      required: ["text"]
    }
  }
];

async function callTool(name, args = {}) {
  if (name === "get_summary") return getSummary();
  if (name === "list_prospects") return listRecords("prospects", args);
  if (name === "create_prospect") return appendRecord("prospects", buildProspect(args));
  if (name === "list_research_briefs") return listRecords("research", args);
  if (name === "create_research_brief") return appendRecord("research", buildResearchBrief(args));
  if (name === "list_outreach_drafts") return listRecords("outreach", args);
  if (name === "create_outreach_draft") return appendRecord("outreach", buildOutreachDraft(args));
  if (name === "update_outreach_draft") return updateRecord("outreach", "draft_id", args.draft_id, args.updates || {});
  if (name === "run_scout") return runScout({ sourcePath: args.source, limit: Number(args.limit || 3) });
  if (name === "run_research") return runResearch({ hintsPath: args.hints, limit: Number(args.limit || 3) });
  if (name === "run_outreach") return runOutreach({ limit: Number(args.limit || 3) });
  if (name === "run_pipeline") {
    return runDailyPipeline({
      scoutSource: args.scout_source,
      researchHints: args.research_hints,
      limit: Number(args.limit || 3)
    });
  }
  if (name === "telegram_command") return { text: await routeCommand(args.text) };
  throw new Error(`Unknown tool: ${name}`);
}

let buffer = Buffer.alloc(0);

function send(message) {
  const body = Buffer.from(JSON.stringify(message), "utf8");
  process.stdout.write(`Content-Length: ${body.length}\r\n\r\n`);
  process.stdout.write(body);
}

function sendLine(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

let transport = "content-length";

function sendResponse(message) {
  if (transport === "json-line") {
    sendLine(message);
    return;
  }
  send(message);
}

async function handle(message) {
  debug(`handle ${message.method || "unknown"} id=${message.id ?? ""}`);
  try {
    if (message.method === "initialize") {
      sendResponse({
        jsonrpc: "2.0",
        id: message.id,
        result: {
          protocolVersion: message.params?.protocolVersion || "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "optima-sales-machine", version: "0.1.0" }
        }
      });
      return;
    }

    if (message.method === "notifications/initialized") return;

    if (message.method === "tools/list") {
      sendResponse({ jsonrpc: "2.0", id: message.id, result: { tools } });
      return;
    }

    if (message.method === "tools/call") {
      const result = await callTool(message.params?.name, message.params?.arguments || {});
      sendResponse({
        jsonrpc: "2.0",
        id: message.id,
        result: {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        }
      });
      return;
    }

    sendResponse({
      jsonrpc: "2.0",
      id: message.id,
      error: { code: -32601, message: `Method not found: ${message.method}` }
    });
  } catch (error) {
    sendResponse({
      jsonrpc: "2.0",
      id: message.id,
      error: { code: -32000, message: error.message }
    });
  }
}

function processBuffer() {
  while (true) {
    let separator = "\r\n\r\n";
    let headerEnd = buffer.indexOf(separator);
    if (headerEnd === -1) {
      separator = "\n\n";
      headerEnd = buffer.indexOf(separator);
    }
    if (headerEnd === -1) {
      const lineEnd = buffer.indexOf("\n");
      if (lineEnd === -1) return;

      const line = buffer.slice(0, lineEnd).toString("utf8").trim();
      buffer = buffer.slice(lineEnd + 1);
      if (!line) continue;
      transport = "json-line";
      handle(JSON.parse(line));
      continue;
    }

    const header = buffer.slice(0, headerEnd).toString("utf8");
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      buffer = buffer.slice(headerEnd + 4);
      continue;
    }

    const length = Number(match[1]);
    const bodyStart = headerEnd + separator.length;
    const bodyEnd = bodyStart + length;
    if (buffer.length < bodyEnd) return;

    const body = buffer.slice(bodyStart, bodyEnd).toString("utf8");
    buffer = buffer.slice(bodyEnd);
    handle(JSON.parse(body));
  }
}

process.stdin.on("data", (chunk) => {
  debug(`stdin-bytes ${chunk.length}`);
  debug(`stdin-preview ${JSON.stringify(chunk.toString("utf8").slice(0, 240))}`);
  buffer = Buffer.concat([buffer, chunk]);
  processBuffer();
});
