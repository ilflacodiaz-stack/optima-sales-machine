import { runOutreach } from "./outreach-runner.mjs";
import { runResearch } from "./research-runner.mjs";
import { runScout } from "./scout-runner.mjs";
import { files, now, readJson, writeJson } from "./state-store.mjs";

function getArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

async function appendRun(record) {
  const runs = await readJson(files.runs);
  runs.push(record);
  await writeJson(files.runs, runs);
  return record;
}

async function runDailyPipeline({ scoutSource, researchHints, limit }) {
  if (!scoutSource) throw new Error("Missing --scout-source=path/to/candidates.json");

  const scout = await runScout({ sourcePath: scoutSource, limit });
  const research = await runResearch({ hintsPath: researchHints, limit });
  const outreach = await runOutreach({ limit });

  const run = await appendRun({
    run_id: `pipeline-${Date.now()}`,
    run_type: "PIPELINE",
    scout_run_id: scout.run_id,
    research_run_id: research.run_id,
    outreach_run_id: outreach.run_id,
    prospects_added: scout.prospects_added,
    research_added: research.research_added,
    drafts_added: outreach.drafts_added,
    status: "COMPLETED",
    created_at: now()
  });

  return {
    run_id: run.run_id,
    scout,
    research,
    outreach
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runDailyPipeline({
      scoutSource: getArg("scout-source"),
      researchHints: getArg("research-hints"),
      limit: Number(getArg("limit", "3")) || 3
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}

export { runDailyPipeline };
