import {
  listRecords,
  updateRecord
} from "./state-store.mjs";

function formatList(items, formatItem) {
  return items.length ? items.map(formatItem).join("\n") : "No records found.";
}

function findById(records, idKey, idValue) {
  return records.find((record) => record[idKey] === idValue);
}

function displayText(value) {
  return String(value || "").replace(/\\n/g, "\n");
}

async function getState() {
  const [prospects, research, outreach] = await Promise.all([
    listRecords("prospects"),
    listRecords("research"),
    listRecords("outreach")
  ]);
  return { prospects, research, outreach };
}

function findProspectBundle(state, prospectId) {
  const prospect = findById(state.prospects, "prospect_id", prospectId);
  const brief = findById(state.research, "prospect_id", prospectId);
  const draft = findById(state.outreach, "prospect_id", prospectId);
  return { prospect, brief, draft };
}

function help() {
  return `Optima commands

/today
/prospects
/brief <prospect_id>
/drafts <prospect_id>
/approve <draft_id>
/reject <draft_id>
/mark_sent <draft_id>
/mark_replied <draft_id>
/follow_up <draft_id>
/meeting_booked <draft_id>
/not_interested <draft_id>
/note <draft_id> <note>
/meeting_details <draft_id> <details>`;
}

async function today() {
  const { prospects, research, outreach } = await getState();
  const approved = outreach.filter((item) => item.status === "APPROVED");
  const ready = outreach.filter((item) => item.status === "OUTREACH_DRAFTED");
  const rejected = outreach.filter((item) => item.status === "REJECTED");
  const sent = outreach.filter((item) => item.status === "SENT");
  const replied = outreach.filter((item) => item.status === "REPLIED");
  const followUpDue = outreach.filter((item) => item.status === "FOLLOW_UP_DUE");
  const meetingBooked = outreach.filter((item) => item.status === "MEETING_BOOKED");
  const notInterested = outreach.filter((item) => item.status === "NOT_INTERESTED");

  return `Optima today

Prospects: ${prospects.length}
Research briefs: ${research.length}
Qualified: ${research.filter((item) => item.status === "QUALIFIED").length}
Drafts ready: ${ready.length}
Approved: ${approved.length}
Rejected: ${rejected.length}
Sent: ${sent.length}
Replied: ${replied.length}
Follow-up due: ${followUpDue.length}
Meeting booked: ${meetingBooked.length}
Not interested: ${notInterested.length}

Approved drafts:
${formatList(approved, (item) => `- ${item.company_name} (${item.draft_id})`)}

Follow-ups:
${formatList(followUpDue, (item) => `- ${item.company_name} (${item.draft_id})`)}

Meetings:
${formatList(meetingBooked, (item) => `- ${item.company_name} (${item.draft_id})${item.meeting_details ? ` - ${item.meeting_details}` : ""}`)}`;
}

async function prospects() {
  const { prospects, research, outreach } = await getState();

  return `Prospects

${formatList(prospects, (prospect) => {
    const brief = findById(research, "prospect_id", prospect.prospect_id);
    const draft = findById(outreach, "prospect_id", prospect.prospect_id);
    const status = draft?.status || brief?.status || prospect.status;
    return `- ${prospect.company_name} (${prospect.prospect_id}) - ${status}`;
  })}`;
}

async function brief(prospectId) {
  if (!prospectId) return "Usage: /brief <prospect_id>";

  const state = await getState();
  const { prospect, brief } = findProspectBundle(state, prospectId);
  if (!prospect) return `Prospect not found: ${prospectId}`;
  if (!brief) return `No research brief yet for ${prospect.company_name}.`;

  return `Brief: ${brief.company_name}

Score: ${brief.qualification_score} / ${brief.confidence}
Activity: ${brief.estimated_activity || "Unknown"}
CRM signals: ${brief.crm_signals?.join(", ") || "None"}
Angle: ${brief.outreach_angle || "None"}

Pain points:
${formatList(brief.pain_points || [], (item) => `- ${item}`)}

Sources:
${formatList(brief.sources || [], (item) => `- ${item}`)}`;
}

async function drafts(prospectId) {
  if (!prospectId) return "Usage: /drafts <prospect_id>";

  const state = await getState();
  const { prospect, draft } = findProspectBundle(state, prospectId);
  if (!prospect) return `Prospect not found: ${prospectId}`;
  if (!draft) return `No outreach draft yet for ${prospect.company_name}.`;

  return `Drafts: ${draft.company_name}
Status: ${draft.status}
Draft ID: ${draft.draft_id}

WhatsApp:
${displayText(draft.whatsapp) || "No WhatsApp draft."}

Email:
Subject: ${draft.email_subject || "No subject"}
${displayText(draft.email_body) || "No email body."}

LinkedIn:
${displayText(draft.linkedin_dm) || "No LinkedIn draft."}

Approve:
/approve ${draft.draft_id}

Reject:
/reject ${draft.draft_id}

Mark sent:
/mark_sent ${draft.draft_id}

After sending:
/mark_replied ${draft.draft_id}
/follow_up ${draft.draft_id}
/meeting_booked ${draft.draft_id}
/not_interested ${draft.draft_id}
/note ${draft.draft_id} <note>
/meeting_details ${draft.draft_id} <details>`;
}

async function approve(draftId) {
  if (!draftId) return "Usage: /approve <draft_id>";

  const updated = await updateRecord("outreach", "draft_id", draftId, {
    status: "APPROVED",
    approved_at: new Date().toISOString()
  });

  return `Approved draft for ${updated.company_name}.

Next: send the message, then run:
/mark_sent ${updated.draft_id}`;
}

async function reject(draftId) {
  if (!draftId) return "Usage: /reject <draft_id>";

  const updated = await updateRecord("outreach", "draft_id", draftId, {
    status: "REJECTED",
    rejected_at: new Date().toISOString()
  });

  return `Rejected draft for ${updated.company_name}.

Next: revise the outreach draft before sending.`;
}

async function markSent(draftId) {
  if (!draftId) return "Usage: /mark_sent <draft_id>";

  const updated = await updateRecord("outreach", "draft_id", draftId, {
    status: "SENT",
    sent_at: new Date().toISOString()
  });

  return `Marked sent: ${updated.company_name}
Draft: ${updated.draft_id}`;
}

async function markReplied(draftId) {
  if (!draftId) return "Usage: /mark_replied <draft_id>";

  const updated = await updateRecord("outreach", "draft_id", draftId, {
    status: "REPLIED",
    replied_at: new Date().toISOString()
  });

  return `Marked replied: ${updated.company_name}
Draft: ${updated.draft_id}`;
}

async function followUp(draftId) {
  if (!draftId) return "Usage: /follow_up <draft_id>";

  const updated = await updateRecord("outreach", "draft_id", draftId, {
    status: "FOLLOW_UP_DUE",
    follow_up_due_at: new Date().toISOString()
  });

  return `Marked follow-up due: ${updated.company_name}
Draft: ${updated.draft_id}`;
}

async function meetingBooked(draftId) {
  if (!draftId) return "Usage: /meeting_booked <draft_id>";

  const updated = await updateRecord("outreach", "draft_id", draftId, {
    status: "MEETING_BOOKED",
    meeting_booked_at: new Date().toISOString()
  });

  return `Meeting booked: ${updated.company_name}
Draft: ${updated.draft_id}`;
}

async function notInterested(draftId) {
  if (!draftId) return "Usage: /not_interested <draft_id>";

  const updated = await updateRecord("outreach", "draft_id", draftId, {
    status: "NOT_INTERESTED",
    not_interested_at: new Date().toISOString()
  });

  return `Marked not interested: ${updated.company_name}
Draft: ${updated.draft_id}`;
}

async function addNote(draftId, note) {
  if (!draftId || !note) return "Usage: /note <draft_id> <note>";

  const updated = await updateRecord("outreach", "draft_id", draftId, {
    response_note: note,
    response_note_at: new Date().toISOString()
  });

  return `Saved note for ${updated.company_name}.`;
}

async function meetingDetails(draftId, details) {
  if (!draftId || !details) return "Usage: /meeting_details <draft_id> <details>";

  const updated = await updateRecord("outreach", "draft_id", draftId, {
    meeting_details: details,
    meeting_details_updated_at: new Date().toISOString()
  });

  return `Saved meeting details for ${updated.company_name}.`;
}

export async function routeCommand(input) {
  const [command = "", ...args] = String(input || "").trim().split(/\s+/);
  const normalized = command.toLowerCase();

  if (normalized === "/today") return today();
  if (normalized === "/prospects") return prospects();
  if (normalized === "/brief") return brief(args[0]);
  if (normalized === "/drafts") return drafts(args[0]);
  if (normalized === "/approve") return approve(args[0]);
  if (normalized === "/reject") return reject(args[0]);
  if (normalized === "/mark_sent") return markSent(args[0]);
  if (normalized === "/mark_replied") return markReplied(args[0]);
  if (normalized === "/follow_up") return followUp(args[0]);
  if (normalized === "/meeting_booked") return meetingBooked(args[0]);
  if (normalized === "/not_interested") return notInterested(args[0]);
  if (normalized === "/note") return addNote(args[0], args.slice(1).join(" "));
  if (normalized === "/meeting_details") return meetingDetails(args[0], args.slice(1).join(" "));
  return help();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const command = process.argv.slice(2).join(" ");
    process.stdout.write(`${await routeCommand(command)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}
