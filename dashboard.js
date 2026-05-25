const state = {
  prospects: [],
  research: [],
  outreach: [],
  runs: [],
  selectedId: "",
  apiOnline: false
};

const elements = {
  lastUpdated: document.querySelector("#lastUpdated"),
  metricProspects: document.querySelector("#metricProspects"),
  metricResearched: document.querySelector("#metricResearched"),
  metricQualified: document.querySelector("#metricQualified"),
  metricDrafts: document.querySelector("#metricDrafts"),
  metricReviewQueue: document.querySelector("#metricReviewQueue"),
  metricApproved: document.querySelector("#metricApproved"),
  metricMeetings: document.querySelector("#metricMeetings"),
  metricMeetingRate: document.querySelector("#metricMeetingRate"),
  caseStudyNote: document.querySelector("#caseStudyNote"),
  copyCaseStudyBtn: document.querySelector("#copyCaseStudyBtn"),
  commandStatus: document.querySelector("#commandStatus"),
  dailyRuns: document.querySelector("#dailyRuns"),
  prospectList: document.querySelector("#prospectList"),
  detailPanel: document.querySelector("#detailPanel"),
  refreshBtn: document.querySelector("#refreshBtn"),
  prospectForm: document.querySelector("#prospectForm"),
  formStatus: document.querySelector("#formStatus")
};

const API_BASE = window.OPTIMA_API_BASE || (
  ["4173", "5173"].includes(window.location.port)
    ? "http://127.0.0.1:8787"
    : ""
);
const isStaticDemo = API_BASE === "";
const STATIC_STATE_BASE = isStaticDemo ? "demo-state" : "state";

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }
  return response.json();
}

async function loadState() {
  try {
    const apiOnline = await checkApi();
    const [prospects, research, outreach, runs] = apiOnline
      ? await Promise.all([
        loadJson(`${API_BASE}/prospects`),
        loadJson(`${API_BASE}/research-briefs`),
        loadJson(`${API_BASE}/outreach-drafts`),
        loadJson(`${API_BASE}/runs`)
      ])
      : await Promise.all([
        loadJson(`${STATIC_STATE_BASE}/prospects.json`),
        loadJson(`${STATIC_STATE_BASE}/research_briefs.json`),
        loadJson(`${STATIC_STATE_BASE}/outreach_drafts.json`),
        loadJson(`${STATIC_STATE_BASE}/daily_runs.json`)
      ]);

    state.prospects = prospects;
    state.research = research;
    state.outreach = outreach;
    state.runs = runs;
    state.apiOnline = apiOnline;
    state.selectedId ||= prospects[0]?.prospect_id || "";
    render();
  } catch (error) {
    elements.detailPanel.innerHTML = `<div class="error">${escapeHtml(error.message)}. Make sure this is opened through the local server, not as a file.</div>`;
  }
}

async function checkApi() {
  try {
    const response = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function displayText(value) {
  return escapeHtml(String(value ?? "").replace(/\\n/g, "\n"));
}

function findResearch(prospectId) {
  return state.research.find((item) => item.prospect_id === prospectId);
}

function findOutreach(prospectId) {
  return state.outreach.find((item) => item.prospect_id === prospectId);
}

function statusTag(prospect) {
  const research = findResearch(prospect.prospect_id);
  const outreach = findOutreach(prospect.prospect_id);

  if (outreach?.status === "APPROVED") return ["APPROVED", ""];
  if (outreach?.status === "SENT") return ["SENT", ""];
  if (outreach?.status === "REPLIED") return ["REPLIED", ""];
  if (outreach?.status === "FOLLOW_UP_DUE") return ["FOLLOW_UP_DUE", "warning"];
  if (outreach?.status === "MEETING_BOOKED") return ["MEETING_BOOKED", ""];
  if (outreach?.status === "NOT_INTERESTED") return ["NOT_INTERESTED", "danger"];
  if (outreach?.status === "REJECTED") return ["REJECTED", "danger"];
  if (outreach) return [outreach.status || "OUTREACH_DRAFTED", ""];
  if (research?.status === "QUALIFIED") return ["QUALIFIED", ""];
  if (research?.status === "NEEDS_REVIEW") return ["NEEDS_REVIEW", "warning"];
  if (research?.status === "REJECTED") return ["REJECTED", "danger"];
  return [prospect.status || "SCOUTED", "warning"];
}

function render() {
  renderMetrics();
  renderCaseStudy();
  renderApiStatus();
  renderRuns();
  renderProspects();
  renderDetails();
  elements.lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function renderApiStatus(message = "") {
  elements.formStatus.textContent = message || (state.apiOnline
    ? "State API: connected"
    : isStaticDemo
      ? "Portfolio demo: bundled state. Connect Supabase/API to enable writes."
      : "State API: offline. Start it to add prospects.");
  elements.prospectForm.classList.toggle("disabled", !state.apiOnline);
  elements.prospectForm.querySelectorAll("input, textarea, button").forEach((field) => {
    field.disabled = !state.apiOnline;
  });
  document.querySelectorAll("[data-runner]").forEach((button) => {
    button.disabled = !state.apiOnline;
  });
  if (elements.commandStatus && !message) {
    elements.commandStatus.textContent = state.apiOnline
      ? "State API connected. Agents can run from dashboard."
      : isStaticDemo
        ? "Vercel demo mode. Agent runs are shown locally or with a production API."
        : "Start the State API to run agents.";
  }
}

function renderMetrics() {
  elements.metricProspects.textContent = state.prospects.length;
  elements.metricResearched.textContent = state.research.length;
  elements.metricQualified.textContent = state.research.filter((item) => item.status === "QUALIFIED").length;
  elements.metricDrafts.textContent = state.outreach.filter((item) => ["OUTREACH_DRAFTED", "APPROVED", "SENT", "REPLIED", "FOLLOW_UP_DUE", "MEETING_BOOKED"].includes(item.status)).length;
}

function getCaseStudyStats() {
  const prospects = state.prospects.length;
  const qualified = state.research.filter((item) => item.status === "QUALIFIED").length;
  const ready = state.outreach.filter((item) => item.status === "OUTREACH_DRAFTED").length;
  const approved = state.outreach.filter((item) => item.status === "APPROVED").length;
  const sent = state.outreach.filter((item) => ["SENT", "REPLIED", "FOLLOW_UP_DUE", "MEETING_BOOKED", "NOT_INTERESTED"].includes(item.status)).length;
  const meetings = state.outreach.filter((item) => item.status === "MEETING_BOOKED").length;

  return {
    prospects,
    qualified,
    ready,
    approved,
    sent,
    meetings,
    qualificationRate: formatPercent(qualified, prospects),
    meetingRate: formatPercent(meetings, prospects)
  };
}

function formatPercent(numerator, denominator) {
  if (!denominator) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function renderCaseStudy() {
  const stats = getCaseStudyStats();
  elements.metricReviewQueue.textContent = stats.ready;
  elements.metricApproved.textContent = stats.approved;
  elements.metricMeetings.textContent = stats.meetings;
  elements.metricMeetingRate.textContent = stats.meetingRate;
  elements.caseStudyNote.textContent = `${stats.prospects} surfaced, ${stats.qualified} qualified (${stats.qualificationRate}), ${stats.sent} sent or progressed, ${stats.meetings} meetings booked.`;
}

function buildCaseStudySummary() {
  const stats = getCaseStudyStats();
  return `Optima Sales Machine - Sprint 4 case study

Multi-agent system:
- Scout finds ICP-fit inmobiliarias
- James Research enriches and scores prospects
- Outreach drafts WhatsApp, email, and LinkedIn messages
- Orchestrator coordinates the daily workflow

Current metrics:
- Prospects surfaced: ${stats.prospects}
- Qualified research briefs: ${stats.qualified}
- Drafts ready for review: ${stats.ready}
- Approved drafts: ${stats.approved}
- Outreach sent/progressed: ${stats.sent}
- Meetings booked: ${stats.meetings}
- Prospect-to-meeting rate: ${stats.meetingRate}`;
}

function renderRuns() {
  if (!state.runs.length) {
    elements.dailyRuns.innerHTML = `<p class="muted">No Scout runs logged yet.</p>`;
    return;
  }

  elements.dailyRuns.innerHTML = state.runs.slice().reverse().slice(0, 3).map((run) => `
    <article class="run-card">
      <div>
        <strong>${escapeHtml(run.run_type || "RUN")}</strong>
        <p>${escapeHtml(run.source_name || "Unknown source")}</p>
      </div>
      <div class="run-stats">
        <span>${escapeHtml(run.candidates_seen || 0)} seen</span>
        <span>${escapeHtml(run.prospects_added?.length || 0)} added</span>
        <span>${escapeHtml(run.duplicates_skipped?.length || 0)} duplicates</span>
      </div>
    </article>
  `).join("");
}

function renderProspects() {
  if (!state.prospects.length) {
    elements.prospectList.innerHTML = `<p class="muted">No prospects yet. Add one with the state CLI.</p>`;
    return;
  }

  elements.prospectList.innerHTML = state.prospects.map((prospect) => {
    const [tag, tone] = statusTag(prospect);
    return `
      <button class="prospect-card ${prospect.prospect_id === state.selectedId ? "active" : ""}" data-id="${escapeHtml(prospect.prospect_id)}" type="button">
        <strong>${escapeHtml(prospect.company_name)}</strong>
        <div class="prospect-meta">
          <span>${escapeHtml(prospect.location || "Unknown location")}</span>
          <span>${escapeHtml(prospect.listing_count_estimate ? `${prospect.listing_count_estimate} listings` : "No listing count")}</span>
          <span class="tag ${tone}">${escapeHtml(tag)}</span>
        </div>
      </button>
    `;
  }).join("");

  document.querySelectorAll(".prospect-card").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedId = card.dataset.id;
      render();
    });
  });
}

function renderDetails() {
  const prospect = state.prospects.find((item) => item.prospect_id === state.selectedId);
  if (!prospect) {
    elements.detailPanel.innerHTML = `
      <div class="empty-state">
        <h2>Select a prospect</h2>
        <p>Choose a prospect to inspect the multi-agent handoff.</p>
      </div>
    `;
    return;
  }

  const research = findResearch(prospect.prospect_id);
  const outreach = findOutreach(prospect.prospect_id);
  const score = research?.qualification_score ?? "-";

  elements.detailPanel.innerHTML = `
    <div class="detail-header">
      <div>
        <p class="eyebrow">${escapeHtml(prospect.source || "Source")}</p>
        <h2>${escapeHtml(prospect.company_name)}</h2>
        <p class="muted">${escapeHtml(prospect.why_flagged || "No scout note yet.")}</p>
      </div>
      <div class="score">${escapeHtml(score)}</div>
    </div>

    <div class="detail-grid">
      ${infoBlock("Scout Output", [
        ["Location", prospect.location],
        ["Listings", prospect.listing_count_estimate || "Unknown"],
        ["Contacts", prospect.contact_paths?.join(", ") || "None"],
        ["Confidence", prospect.confidence]
      ])}

      ${research ? infoBlock("Research Brief", [
        ["Summary", research.summary],
        ["Activity", research.estimated_activity],
        ["CRM Signals", research.crm_signals?.join(", ") || "None"],
        ["Competitors", research.competitor_signals?.join(", ") || "None"],
        ["Angle", research.outreach_angle]
      ]) : missingBlock("Research Brief", "Waiting for Research Agent.")}

      ${research ? listBlock("Pain Points", research.pain_points) : missingBlock("Pain Points", "Research Agent has not written pain points yet.")}
      ${research ? listBlock("Sources", research.sources?.length ? research.sources : ["No sources saved yet."]) : missingBlock("Sources", "Research Agent has not saved sources yet.")}
    </div>

    <div class="drafts">
      ${outreach ? renderDrafts(outreach) : missingBlock("Outreach Drafts", "Waiting for Outreach Agent.")}
    </div>
  `;
}

function infoBlock(title, rows) {
  return `
    <article class="info-block">
      <h3>${escapeHtml(title)}</h3>
      ${rows.map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value || "Unknown")}</p>`).join("")}
    </article>
  `;
}

function listBlock(title, items = []) {
  return `
    <article class="info-block">
      <h3>${escapeHtml(title)}</h3>
      <ul>
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </article>
  `;
}

function missingBlock(title, message) {
  return `
    <article class="info-block">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
    </article>
  `;
}

function renderDrafts(draft) {
  const isApproved = draft.status === "APPROVED";
  const isSent = draft.status === "SENT";
  const isRejected = draft.status === "REJECTED";
  const isReplied = draft.status === "REPLIED";
  const isFollowUpDue = draft.status === "FOLLOW_UP_DUE";
  const isMeetingBooked = draft.status === "MEETING_BOOKED";
  const isClosed = ["MEETING_BOOKED", "NOT_INTERESTED"].includes(draft.status);
  return `
    <article class="draft-actions">
      <div>
        <h3>Outreach Drafts</h3>
        <p class="muted">Status: <strong>${escapeHtml(draft.status || "OUTREACH_DRAFTED")}</strong></p>
      </div>
      <div class="draft-action-buttons">
        <button class="approve-btn" data-action="approve-draft" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${isApproved || isSent || !state.apiOnline ? "disabled" : ""}>
          ${isApproved || isSent ? "Approved" : "Approve"}
        </button>
        <button class="reject-btn" data-action="reject-draft" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${isRejected || isSent || !state.apiOnline ? "disabled" : ""}>
          ${isRejected ? "Rejected" : "Reject"}
        </button>
        <button class="sent-btn" data-action="mark-sent" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${!isApproved || isSent || isRejected || !state.apiOnline ? "disabled" : ""}>
          ${isSent || isReplied || isFollowUpDue ? "Sent" : "Mark sent"}
        </button>
        <button class="reply-btn" data-action="mark-replied" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${(!isSent && !isFollowUpDue) || isReplied || isRejected || isClosed || !state.apiOnline ? "disabled" : ""}>
          ${isReplied || isMeetingBooked ? "Replied" : "Set replied"}
        </button>
        <button class="follow-btn" data-action="follow-up" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${!isSent || isReplied || isFollowUpDue || isRejected || isClosed || !state.apiOnline ? "disabled" : ""}>
          ${isFollowUpDue ? "Follow-up due" : "Follow up"}
        </button>
      </div>
    </article>
    ${renderOutcomeControls(draft)}
    ${renderMeetingControls(draft)}
    <article class="draft-block">
      <div class="draft-channel-heading">
        <h3>WhatsApp</h3>
        <button data-action="copy-draft" data-copy-text="${escapeHtml(displayRawText(draft.whatsapp || ""))}" type="button">Copy</button>
      </div>
      <p>${displayText(draft.whatsapp || "No WhatsApp draft yet.")}</p>
    </article>
    <article class="draft-block">
      <div class="draft-channel-heading">
        <h3>Email</h3>
        <button data-action="copy-draft" data-copy-text="${escapeHtml(formatEmailCopy(draft))}" type="button">Copy</button>
      </div>
      <p><strong>${escapeHtml(draft.email_subject || "No subject")}</strong></p>
      <p>${displayText(draft.email_body || "No email body yet.")}</p>
    </article>
    <article class="draft-block">
      <div class="draft-channel-heading">
        <h3>LinkedIn DM</h3>
        <button data-action="copy-draft" data-copy-text="${escapeHtml(displayRawText(draft.linkedin_dm || ""))}" type="button">Copy</button>
      </div>
      <p>${displayText(draft.linkedin_dm || "No LinkedIn draft yet.")}</p>
    </article>
  `;
}

function renderOutcomeControls(draft) {
  const canLogOutcome = ["REPLIED", "FOLLOW_UP_DUE", "MEETING_BOOKED"].includes(draft.status);
  if (!canLogOutcome && !draft.response_note) return "";

  return `
    <article class="outcome-block">
      <div>
        <h3>Response Outcome</h3>
        <p class="muted">${escapeHtml(draft.response_note || "No response note saved yet.")}</p>
      </div>
      <textarea data-role="response-note" rows="3" placeholder="Paste the reply or next-step note">${escapeHtml(draft.response_note || "")}</textarea>
      <div class="draft-action-buttons">
        <button class="sent-btn" data-action="save-note" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${!state.apiOnline ? "disabled" : ""}>Save note</button>
        <button class="reply-btn" data-action="meeting-booked" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${!canLogOutcome || !state.apiOnline ? "disabled" : ""}>Meeting booked</button>
        <button class="reject-btn" data-action="not-interested" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${!canLogOutcome || !state.apiOnline ? "disabled" : ""}>Not interested</button>
      </div>
    </article>
  `;
}

function renderMeetingControls(draft) {
  if (draft.status !== "MEETING_BOOKED") return "";

  return `
    <article class="outcome-block">
      <div>
        <h3>Meeting Prep</h3>
        <p class="muted">${escapeHtml(draft.meeting_details || "Add date, attendee, objective, and what to prepare.")}</p>
      </div>
      <textarea data-role="meeting-details" rows="4" placeholder="Example: Tuesday 10:00. Goal: qualify lead volume and current CRM. Prep: show WhatsApp lead triage demo.">${escapeHtml(draft.meeting_details || "")}</textarea>
      <div class="draft-action-buttons">
        <button class="sent-btn" data-action="save-meeting-details" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${!state.apiOnline ? "disabled" : ""}>Save meeting prep</button>
      </div>
    </article>
  `;
}

function displayRawText(value) {
  return String(value ?? "").replace(/\\n/g, "\n");
}

function formatEmailCopy(draft) {
  return `Subject: ${draft.email_subject || ""}\n\n${displayRawText(draft.email_body || "")}`;
}

async function approveDraft(draftId) {
  return updateDraft(draftId, {
    status: "APPROVED",
    approved_at: new Date().toISOString()
  }, "Approving draft...", "Draft approved");
}

async function markDraftSent(draftId) {
  return updateDraft(draftId, {
    status: "SENT",
    sent_at: new Date().toISOString()
  }, "Marking draft sent...", "Draft marked sent");
}

async function markDraftReplied(draftId) {
  return updateDraft(draftId, {
    status: "REPLIED",
    replied_at: new Date().toISOString()
  }, "Marking replied...", "Draft marked replied");
}

async function markDraftFollowUp(draftId) {
  return updateDraft(draftId, {
    status: "FOLLOW_UP_DUE",
    follow_up_due_at: new Date().toISOString()
  }, "Marking follow-up due...", "Follow-up marked due");
}

async function markMeetingBooked(draftId) {
  return updateDraft(draftId, {
    status: "MEETING_BOOKED",
    meeting_booked_at: new Date().toISOString()
  }, "Saving meeting outcome...", "Meeting booked");
}

async function markNotInterested(draftId) {
  return updateDraft(draftId, {
    status: "NOT_INTERESTED",
    not_interested_at: new Date().toISOString()
  }, "Saving outcome...", "Marked not interested");
}

async function saveResponseNote(draftId, note) {
  return updateDraft(draftId, {
    response_note: note,
    response_note_at: new Date().toISOString()
  }, "Saving note...", "Response note saved");
}

async function saveMeetingDetails(draftId, details) {
  return updateDraft(draftId, {
    meeting_details: details,
    meeting_details_updated_at: new Date().toISOString()
  }, "Saving meeting prep...", "Meeting prep saved");
}

async function rejectDraft(draftId) {
  return updateDraft(draftId, {
    status: "REJECTED",
    rejected_at: new Date().toISOString()
  }, "Rejecting draft...", "Draft rejected");
}

async function updateDraft(draftId, updates, loadingMessage, successMessage) {
  if (!state.apiOnline) {
    renderApiStatus("State API must be connected to update drafts.");
    return;
  }

  renderApiStatus(loadingMessage);
  try {
    const response = await fetch(`${API_BASE}/outreach-drafts/${encodeURIComponent(draftId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Could not approve draft");
    }

    renderApiStatus(successMessage);
    await loadState();
  } catch (error) {
    renderApiStatus(error.message);
  }
}

async function copyDraftText(text) {
  const cleanText = displayRawText(text);
  if (!cleanText) {
    renderApiStatus("Nothing to copy.");
    return;
  }

  try {
    await navigator.clipboard.writeText(cleanText);
    renderApiStatus("Copied draft text");
  } catch {
    renderApiStatus("Copy failed. Select the draft text manually.");
  }
}

async function copyCaseStudySummary() {
  try {
    await navigator.clipboard.writeText(buildCaseStudySummary());
    renderApiStatus("Copied case study summary");
  } catch {
    renderApiStatus("Copy failed. Select the summary manually.");
  }
}

async function addProspect(event) {
  event.preventDefault();
  if (!state.apiOnline) {
    renderApiStatus("Start the State API before adding prospects.");
    return;
  }

  const formData = new FormData(elements.prospectForm);
  const contactPaths = formData.getAll("contact_paths");
  const listingCount = formData.get("listing_count_estimate");
  const payload = {
    company_name: formData.get("company_name"),
    location: formData.get("location") || "Buenos Aires",
    source: formData.get("source") || "manual dashboard",
    listing_count_estimate: listingCount ? Number(listingCount) : null,
    contact_paths: contactPaths,
    why_flagged: formData.get("why_flagged") || "Manual dashboard prospect",
    confidence: "medium"
  };

  renderApiStatus("Adding prospect...");

  try {
    const response = await fetch(`${API_BASE}/prospects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Could not add prospect");
    }

    const prospect = await response.json();
    state.selectedId = prospect.prospect_id;
    elements.prospectForm.reset();
    document.querySelector("#sourceInput").value = "manual dashboard";
    renderApiStatus(`Added ${prospect.company_name}`);
    await loadState();
  } catch (error) {
    renderApiStatus(error.message);
  }
}

function runnerConfig(type) {
  if (type === "scout") {
    return {
      path: "/scout/run",
      body: {
        source: "optima-sales-machine/sources/zonaprop-caba-candidates.json",
        limit: 3
      },
      loading: "Scout is checking candidate sources...",
      success: "Scout run complete"
    };
  }

  if (type === "research") {
    return {
      path: "/research/run",
      body: {
        hints: "optima-sales-machine/sources/james-research-hints.json",
        limit: 3
      },
      loading: "James Research is enriching scouted prospects...",
      success: "Research run complete"
    };
  }

  if (type === "outreach") {
    return {
      path: "/outreach/run",
      body: { limit: 3 },
      loading: "Outreach is drafting channel messages...",
      success: "Outreach drafts updated"
    };
  }

  return {
    path: "/pipeline/run",
    body: {
      scout_source: "optima-sales-machine/sources/zonaprop-caba-candidates.json",
      research_hints: "optima-sales-machine/sources/james-research-hints.json",
      limit: 3
    },
    loading: "Orchestrator is running Scout -> James -> Outreach...",
    success: "Daily sequence complete"
  };
}

async function runAgent(type) {
  if (!state.apiOnline) {
    renderApiStatus("State API must be connected to run agents.");
    return;
  }

  const config = runnerConfig(type);
  elements.commandStatus.textContent = config.loading;
  renderApiStatus(config.loading);

  try {
    const response = await fetch(`${API_BASE}${config.path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config.body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Agent run failed");
    }

    const result = await response.json();
    const summary = summarizeRunResult(type, result);
    elements.commandStatus.textContent = `${config.success}: ${summary}`;
    renderApiStatus(config.success);
    await loadState();
  } catch (error) {
    elements.commandStatus.textContent = error.message;
    renderApiStatus(error.message);
  }
}

function summarizeRunResult(type, result) {
  if (type === "scout") {
    return `${result.prospects_added?.length || 0} added, ${result.duplicates_skipped?.length || 0} duplicates`;
  }

  if (type === "research") {
    return `${result.briefs_added?.length || result.research_briefs_added?.length || 0} briefs`;
  }

  if (type === "outreach") {
    return `${result.drafts_added?.length || result.outreach_drafts_added?.length || 0} drafts`;
  }

  const scoutAdded = result.scout?.prospects_added?.length || 0;
  const briefsAdded = result.research?.briefs_added?.length || result.research?.research_briefs_added?.length || 0;
  const draftsAdded = result.outreach?.drafts_added?.length || result.outreach?.outreach_drafts_added?.length || 0;
  return `${scoutAdded} prospects, ${briefsAdded} briefs, ${draftsAdded} drafts`;
}

elements.refreshBtn.addEventListener("click", loadState);
elements.prospectForm.addEventListener("submit", addProspect);
elements.copyCaseStudyBtn.addEventListener("click", copyCaseStudySummary);
document.querySelectorAll("[data-runner]").forEach((button) => {
  button.addEventListener("click", () => runAgent(button.dataset.runner));
});
elements.detailPanel.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action='approve-draft']");
  if (action) {
    approveDraft(action.dataset.draftId);
    return;
  }

  const sentAction = event.target.closest("[data-action='mark-sent']");
  if (sentAction) {
    markDraftSent(sentAction.dataset.draftId);
    return;
  }

  const rejectAction = event.target.closest("[data-action='reject-draft']");
  if (rejectAction) {
    rejectDraft(rejectAction.dataset.draftId);
    return;
  }

  const copyAction = event.target.closest("[data-action='copy-draft']");
  if (copyAction) {
    copyDraftText(copyAction.dataset.copyText);
    return;
  }

  const replyAction = event.target.closest("[data-action='mark-replied']");
  if (replyAction) {
    markDraftReplied(replyAction.dataset.draftId);
    return;
  }

  const followAction = event.target.closest("[data-action='follow-up']");
  if (followAction) {
    markDraftFollowUp(followAction.dataset.draftId);
    return;
  }

  const meetingAction = event.target.closest("[data-action='meeting-booked']");
  if (meetingAction) {
    markMeetingBooked(meetingAction.dataset.draftId);
    return;
  }

  const notInterestedAction = event.target.closest("[data-action='not-interested']");
  if (notInterestedAction) {
    markNotInterested(notInterestedAction.dataset.draftId);
    return;
  }

  const noteAction = event.target.closest("[data-action='save-note']");
  if (noteAction) {
    const note = elements.detailPanel.querySelector("[data-role='response-note']")?.value || "";
    saveResponseNote(noteAction.dataset.draftId, note);
    return;
  }

  const meetingDetailsAction = event.target.closest("[data-action='save-meeting-details']");
  if (meetingDetailsAction) {
    const details = elements.detailPanel.querySelector("[data-role='meeting-details']")?.value || "";
    saveMeetingDetails(meetingDetailsAction.dataset.draftId, details);
  }
});
loadState();
