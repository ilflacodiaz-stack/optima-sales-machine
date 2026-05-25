import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL(".", import.meta.url).pathname;

const requiredFiles = [
  "README.md",
  "tools/state-api-tools.json",
  "agents/scout/agent.json",
  "agents/scout/SOUL.md",
  "agents/james-research/agent.json",
  "agents/james-research/SOUL.md",
  "agents/outreach/agent.json",
  "agents/outreach/SOUL.md",
  "agents/orchestrator/agent.json",
  "agents/orchestrator/SOUL.md",
  "workflows/daily-sales-machine.json"
];

for (const file of requiredFiles) {
  await access(join(root, file));
}

for (const file of requiredFiles.filter((item) => item.endsWith(".json"))) {
  JSON.parse(await readFile(join(root, file), "utf8"));
}

process.stdout.write(JSON.stringify({
  ok: true,
  files_checked: requiredFiles.length,
  agents: [
    "optima-scout",
    "optima-james-research",
    "optima-outreach",
    "optima-orchestrator"
  ]
}, null, 2) + "\n");
