import { basename } from "node:path";
import {
  appendRecord,
  buildProspect,
  files,
  now,
  readJson,
  slugify,
  writeJson
} from "./state-store.mjs";

function getArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function normalize(value) {
  return slugify(value || "");
}

function scoreCandidate(candidate) {
  let score = 0;
  const reasons = [];
  const listingCount = Number(candidate.listing_count_estimate || 0);
  const location = String(candidate.location || "").toLowerCase();
  const contactPaths = Array.isArray(candidate.contact_paths) ? candidate.contact_paths : [];

  if (listingCount >= 100) {
    score += 45;
    reasons.push(`${listingCount} estimated listings`);
  } else if (listingCount >= 20) {
    score += 30;
    reasons.push(`${listingCount} estimated listings`);
  }

  if (location.includes("caba") || location.includes("gba") || location.includes("buenos aires")) {
    score += 25;
    reasons.push(`operates in ${candidate.location}`);
  }

  if (contactPaths.length) {
    score += 20;
    reasons.push(`visible contact path: ${contactPaths.join(", ")}`);
  }

  if (candidate.source_detail) {
    score += 10;
    reasons.push(candidate.source_detail);
  }

  return { score, reasons };
}

function buildRejection(candidate, reason) {
  return {
    company_name: candidate.company_name || "Unknown",
    reason,
    listing_count_estimate: candidate.listing_count_estimate ?? null
  };
}

async function appendRun(record) {
  const runs = await readJson(files.runs);
  runs.push(record);
  await writeJson(files.runs, runs);
  return record;
}

async function runScout({ sourcePath, limit }) {
  if (!sourcePath) throw new Error("Missing --source=path/to/candidates.json");

  const source = await readJson(sourcePath);
  const existingProspects = await readJson(files.prospects);
  const existingIds = new Set(existingProspects.map((prospect) => normalize(prospect.prospect_id || prospect.company_name)));
  const candidates = Array.isArray(source.candidates) ? source.candidates : [];
  const qualified = [];
  const duplicates = [];
  const rejected = [];

  for (const candidate of candidates) {
    if (!candidate.company_name) {
      rejected.push(buildRejection(candidate, "missing company name"));
      continue;
    }

    const prospectId = normalize(candidate.prospect_id || candidate.company_name);
    if (existingIds.has(prospectId)) {
      duplicates.push(candidate.company_name);
      continue;
    }

    const assessment = scoreCandidate(candidate);
    if (assessment.score < 70) {
      rejected.push(buildRejection(candidate, `score ${assessment.score} below Scout threshold`));
      continue;
    }

    qualified.push({ candidate, assessment, prospectId });
  }

  const selected = qualified
    .sort((a, b) => b.assessment.score - a.assessment.score)
    .slice(0, limit);

  const added = [];
  for (const item of selected) {
    const prospect = buildProspect({
      prospect_id: item.prospectId,
      company_name: item.candidate.company_name,
      source: source.source_name || basename(sourcePath),
      source_url: item.candidate.source_url || source.source_url || "",
      location: item.candidate.location || "Buenos Aires",
      listing_count_estimate: item.candidate.listing_count_estimate,
      contact_paths: item.candidate.contact_paths || [],
      why_flagged: item.assessment.reasons.join("; "),
      confidence: item.assessment.score >= 90 ? "high" : "medium",
      status: "SCOUTED"
    });

    added.push(await appendRecord("prospects", prospect));
    existingIds.add(item.prospectId);
  }

  const run = await appendRun({
    run_id: `scout-${Date.now()}`,
    run_type: "SCOUT",
    source_name: source.source_name || basename(sourcePath),
    source_url: source.source_url || "",
    source_file: sourcePath,
    candidates_seen: candidates.length,
    prospects_added: added.map((prospect) => prospect.prospect_id),
    duplicates_skipped: duplicates,
    rejected,
    status: "COMPLETED",
    created_at: now()
  });

  return {
    run_id: run.run_id,
    candidates_seen: candidates.length,
    prospects_added: added.length,
    added,
    duplicates_skipped: duplicates.length,
    rejected: rejected.length
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runScout({
      sourcePath: getArg("source"),
      limit: Number(getArg("limit", "3")) || 3
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}

export { runScout };
