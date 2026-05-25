import {
  appendRecord,
  buildResearchBrief,
  files,
  now,
  readJson,
  writeJson
} from "./state-store.mjs";

function getArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function defaultPainPoints(prospect) {
  return [
    `${prospect.listing_count_estimate || "Multiple"} active listings can create manual lead qualification load`,
    "Portal inquiries need fast first response before interest cools",
    "Leads from portal/contact forms can be hard to centralize without automation"
  ];
}

function defaultResearch(prospect) {
  const listingCount = Number(prospect.listing_count_estimate || 0);
  const score = listingCount >= 150 ? 78 : listingCount >= 50 ? 70 : 55;

  return {
    summary_hint: `${prospect.company_name} was flagged by Scout from ${prospect.source} with ${listingCount || "unknown"} estimated listings and visible source contact paths.`,
    locations: [prospect.location || "Buenos Aires"],
    estimated_activity: listingCount ? `${listingCount} estimated listings from Scout source.` : "Activity unknown from Scout source.",
    crm_signals: ["No visible CRM detected from Scout data"],
    competitor_signals: prospect.source ? [`${prospect.source} presence`] : [],
    pain_points: defaultPainPoints(prospect),
    outreach_angle: "Improve portal lead response, qualification, and follow-up without replacing the asesor relationship.",
    qualification_score: score,
    confidence: prospect.confidence || "medium",
    sources: [prospect.source_url].filter(Boolean)
  };
}

async function appendRun(record) {
  const runs = await readJson(files.runs);
  runs.push(record);
  await writeJson(files.runs, runs);
  return record;
}

async function runResearch({ hintsPath, limit }) {
  const [prospects, research] = await Promise.all([
    readJson(files.prospects),
    readJson(files.research)
  ]);
  const existingResearchIds = new Set(research.map((brief) => brief.prospect_id));
  const hints = hintsPath ? (await readJson(hintsPath)).hints || {} : {};
  const targets = prospects
    .filter((prospect) => prospect.status === "SCOUTED" && !existingResearchIds.has(prospect.prospect_id))
    .slice(0, limit);

  const added = [];
  for (const prospect of targets) {
    const hint = hints[prospect.prospect_id] || defaultResearch(prospect);
    const record = buildResearchBrief({
      prospect_id: prospect.prospect_id,
      company_name: prospect.company_name,
      summary: hint.summary_hint,
      locations: hint.locations,
      activity: hint.estimated_activity,
      crm_signals: hint.crm_signals,
      competitor_signals: hint.competitor_signals,
      pain_points: hint.pain_points,
      angle: hint.outreach_angle,
      score: hint.qualification_score,
      confidence: hint.confidence,
      sources: hint.sources
    });

    added.push(await appendRecord("research", record));
  }

  const run = await appendRun({
    run_id: `research-${Date.now()}`,
    run_type: "RESEARCH",
    agent_base: "James / Lead Intelligence Agent",
    prospects_seen: targets.length,
    research_added: added.map((brief) => brief.prospect_id),
    status: "COMPLETED",
    created_at: now()
  });

  return {
    run_id: run.run_id,
    prospects_seen: targets.length,
    research_added: added.length,
    added
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runResearch({
      hintsPath: getArg("hints"),
      limit: Number(getArg("limit", "3")) || 3
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}

export { runResearch };
