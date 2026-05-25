import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const stateDir = join(root, "state");

export const files = {
  prospects: join(stateDir, "prospects.json"),
  research: join(stateDir, "research_briefs.json"),
  outreach: join(stateDir, "outreach_drafts.json"),
  runs: join(stateDir, "daily_runs.json")
};

export const now = () => new Date().toISOString();

export function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

export async function writeJson(file, records) {
  await writeFile(file, `${JSON.stringify(records, null, 2)}\n`);
}

export async function listRecords(kind, filters = {}) {
  const file = files[kind];
  if (!file) throw new Error(`Unknown state target: ${kind}`);

  const records = await readJson(file);
  return records.filter((record) => {
    return Object.entries(filters).every(([key, value]) => {
      return value === undefined || value === "" || record[key] === value;
    });
  });
}

export async function appendRecord(kind, record) {
  const file = files[kind];
  if (!file) throw new Error(`Unknown state target: ${kind}`);

  const records = await readJson(file);
  records.push(record);
  await writeJson(file, records);
  return record;
}

export async function updateRecord(kind, idKey, idValue, updates) {
  const file = files[kind];
  if (!file) throw new Error(`Unknown state target: ${kind}`);

  const records = await readJson(file);
  const index = records.findIndex((record) => record[idKey] === idValue);
  if (index === -1) throw new Error(`Record not found: ${idValue}`);

  records[index] = {
    ...records[index],
    ...updates,
    updated_at: now()
  };
  await writeJson(file, records);
  return records[index];
}

export async function getSummary() {
  const prospects = await readJson(files.prospects);
  const research = await readJson(files.research);
  const outreach = await readJson(files.outreach);

  return {
    prospects: prospects.length,
    scouted: prospects.filter((item) => item.status === "SCOUTED").length,
    research_briefs: research.length,
    qualified: research.filter((item) => item.status === "QUALIFIED").length,
    outreach_drafts: outreach.length,
    ready_for_review: outreach.filter((item) => item.status === "OUTREACH_DRAFTED").length,
    approved: outreach.filter((item) => item.status === "APPROVED").length,
    sent: outreach.filter((item) => item.status === "SENT").length,
    replied: outreach.filter((item) => item.status === "REPLIED").length,
    follow_up_due: outreach.filter((item) => item.status === "FOLLOW_UP_DUE").length,
    meeting_booked: outreach.filter((item) => item.status === "MEETING_BOOKED").length,
    not_interested: outreach.filter((item) => item.status === "NOT_INTERESTED").length
  };
}

export function buildProspect(input) {
  const companyName = input.company_name || input.company;
  if (!companyName) {
    throw new Error("Missing company_name");
  }

  const timestamp = now();
  return {
    prospect_id: input.prospect_id || input.id || slugify(companyName),
    company_name: companyName,
    source: input.source || "manual",
    source_url: input.source_url || "",
    location: input.location || "Buenos Aires",
    listing_count_estimate: Number(input.listing_count_estimate ?? input.listing_count ?? "") || null,
    contact_paths: Array.isArray(input.contact_paths) ? input.contact_paths : [],
    why_flagged: input.why_flagged || input.why || "Manual Sprint 4 test prospect",
    confidence: input.confidence || "medium",
    status: input.status || "SCOUTED",
    created_at: input.created_at || timestamp,
    updated_at: timestamp
  };
}

export function buildResearchBrief(input) {
  const prospectId = input.prospect_id;
  const companyName = input.company_name || input.company;
  if (!prospectId || !companyName) {
    throw new Error("Missing prospect_id and/or company_name");
  }

  const score = Number(input.qualification_score ?? input.score ?? 0);
  const timestamp = now();
  return {
    prospect_id: prospectId,
    company_name: companyName,
    summary: input.summary || "",
    locations: Array.isArray(input.locations) ? input.locations : [],
    estimated_activity: input.estimated_activity || input.activity || "",
    crm_signals: Array.isArray(input.crm_signals) ? input.crm_signals : [],
    competitor_signals: Array.isArray(input.competitor_signals) ? input.competitor_signals : [],
    pain_points: Array.isArray(input.pain_points) ? input.pain_points : [],
    outreach_angle: input.outreach_angle || input.angle || "",
    qualification_score: score,
    confidence: input.confidence || "medium",
    sources: Array.isArray(input.sources) ? input.sources : [],
    status: input.status || (score >= 70 ? "QUALIFIED" : score >= 40 ? "NEEDS_REVIEW" : "REJECTED"),
    created_at: input.created_at || timestamp,
    updated_at: timestamp
  };
}

export function buildOutreachDraft(input) {
  const prospectId = input.prospect_id;
  const companyName = input.company_name || input.company;
  if (!prospectId || !companyName) {
    throw new Error("Missing prospect_id and/or company_name");
  }

  const timestamp = now();
  return {
    draft_id: input.draft_id || `${prospectId}-${Date.now()}`,
    prospect_id: prospectId,
    company_name: companyName,
    angle_used: input.angle_used || input.angle || "",
    whatsapp: input.whatsapp || "",
    email_subject: input.email_subject || "",
    email_body: input.email_body || "",
    linkedin_dm: input.linkedin_dm || input.linkedin || "",
    personalization_notes: Array.isArray(input.personalization_notes) ? input.personalization_notes : [],
    risk_notes: Array.isArray(input.risk_notes) ? input.risk_notes : [],
    status: input.status || "OUTREACH_DRAFTED",
    created_at: input.created_at || timestamp,
    updated_at: timestamp
  };
}
