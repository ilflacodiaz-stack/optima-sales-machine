import {
  appendRecord,
  buildOutreachDraft,
  buildProspect,
  buildResearchBrief,
  getSummary,
  listRecords
} from "./state-store.mjs";

function getArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function print(value) {
  process.stdout.write(`${typeof value === "string" ? value : JSON.stringify(value, null, 2)}\n`);
}

async function addProspect() {
  const companyName = getArg("company");
  if (!companyName) {
    throw new Error("Missing --company=\"Company Name\"");
  }

  const record = buildProspect({
    id: getArg("id"),
    company_name: companyName,
    source: getArg("source", "manual"),
    source_url: getArg("source-url"),
    location: getArg("location", "Buenos Aires"),
    listing_count: getArg("listing-count"),
    contact_paths: getArg("contacts")
      ? getArg("contacts").split(",").map((item) => item.trim()).filter(Boolean)
      : [],
    why: getArg("why", "Manual Sprint 4 test prospect"),
    confidence: getArg("confidence", "medium")
  });

  print(await appendRecord("prospects", record));
}

async function addResearchBrief() {
  const prospectId = getArg("prospect-id");
  const companyName = getArg("company");
  if (!prospectId || !companyName) {
    throw new Error("Missing --prospect-id and/or --company");
  }

  const record = buildResearchBrief({
    prospect_id: prospectId,
    company_name: companyName,
    summary: getArg("summary"),
    locations: getArg("locations")
      ? getArg("locations").split(",").map((item) => item.trim()).filter(Boolean)
      : [],
    activity: getArg("activity"),
    crm_signals: getArg("crm")
      ? getArg("crm").split(",").map((item) => item.trim()).filter(Boolean)
      : [],
    competitor_signals: getArg("competitors")
      ? getArg("competitors").split(",").map((item) => item.trim()).filter(Boolean)
      : [],
    pain_points: getArg("pain")
      ? getArg("pain").split("|").map((item) => item.trim()).filter(Boolean)
      : [],
    angle: getArg("angle"),
    score: getArg("score", "0"),
    confidence: getArg("confidence", "medium"),
    sources: getArg("sources")
      ? getArg("sources").split(",").map((item) => item.trim()).filter(Boolean)
      : []
  });

  print(await appendRecord("research", record));
}

async function addOutreachDraft() {
  const prospectId = getArg("prospect-id");
  const companyName = getArg("company");
  if (!prospectId || !companyName) {
    throw new Error("Missing --prospect-id and/or --company");
  }

  const record = buildOutreachDraft({
    draft_id: getArg("draft-id", `${prospectId}-${Date.now()}`),
    prospect_id: prospectId,
    company_name: companyName,
    angle: getArg("angle"),
    whatsapp: getArg("whatsapp"),
    email_subject: getArg("email-subject"),
    email_body: getArg("email-body"),
    linkedin_dm: getArg("linkedin"),
    personalization_notes: getArg("notes")
      ? getArg("notes").split("|").map((item) => item.trim()).filter(Boolean)
      : [],
    risk_notes: getArg("risks")
      ? getArg("risks").split("|").map((item) => item.trim()).filter(Boolean)
      : []
  });

  print(await appendRecord("outreach", record));
}

async function list(kind) {
  print(await listRecords(kind));
}

async function summary() {
  print(await getSummary());
}

function help() {
  print(`Optima Sales Machine state CLI

Commands:
  add-prospect --company="Name" [--source=manual] [--source-url=...] [--location=...] [--listing-count=30] [--contacts=web,whatsapp] [--why=...] [--confidence=medium]
  add-research --prospect-id=id --company="Name" --score=80 [--summary=...] [--crm=Tokko] [--pain="pain one|pain two"] [--angle=...]
  add-outreach --prospect-id=id --company="Name" --whatsapp="..." --email-subject="..." --email-body="..." --linkedin="..."
  list prospects|research|outreach|runs
  summary
`);
}

const command = process.argv[2];
const target = process.argv[3];

try {
  if (command === "add-prospect") await addProspect();
  else if (command === "add-research") await addResearchBrief();
  else if (command === "add-outreach") await addOutreachDraft();
  else if (command === "list") await list(target);
  else if (command === "summary") await summary();
  else help();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
