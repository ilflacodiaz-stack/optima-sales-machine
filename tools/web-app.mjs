import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { handleRequest as handleApiRequest } from "./state-api.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "0.0.0.0";

const apiPrefixes = [
  "/health",
  "/summary",
  "/runs",
  "/prospects",
  "/research-briefs",
  "/outreach-drafts",
  "/telegram-command",
  "/telegram-webhook",
  "/scout/run",
  "/research/run",
  "/outreach/run",
  "/pipeline/run"
];

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function isApiPath(pathname) {
  return apiPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function send(response, status, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  response.end(body);
}

function resolveStaticPath(pathname) {
  const cleanedPath = pathname === "/" ? "/dashboard.html" : pathname;
  const normalized = normalize(decodeURIComponent(cleanedPath)).replace(/^(\.\.[/\\])+/, "");
  return join(root, normalized);
}

async function handleWebRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (isApiPath(url.pathname)) {
    await handleApiRequest(request, response);
    return;
  }

  try {
    const filePath = resolveStaticPath(url.pathname);
    if (!filePath.startsWith(root)) {
      send(response, 403, "Forbidden");
      return;
    }

    const body = await readFile(filePath);
    send(response, 200, body, contentTypes[extname(filePath)] || "application/octet-stream");
  } catch {
    send(response, 404, "Not found");
  }
}

createServer(handleWebRequest).listen(port, host, () => {
  process.stdout.write(`Optima Sales Machine listening on http://${host}:${port}\n`);
});
