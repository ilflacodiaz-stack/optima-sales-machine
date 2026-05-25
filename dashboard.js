const state = {
  prospects: [],
  research: [],
  outreach: [],
  runs: [],
  selectedId: "",
  apiOnline: false,
  formVisible: false
};

const elements = {
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
  formStatus: document.querySelector("#formStatus"),
  toggleFormBtn: document.querySelector("#toggleFormBtn"),
  navProspectCount: document.querySelector("#navProspectCount"),
  statusDot: document.querySelector("#statusDot"),
  statusText: document.querySelector("#statusText"),
  sidebar: document.querySelector("#sidebar"),
  mobileNavToggle: document.querySelector("#mobileNavToggle")
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

  if (outreach?.status === "APPROVED") return ["APPROVED", "success"];
  if (outreach?.status === "SENT") return ["SENT", "info"];
  if (outreach?.status === "REPLIED") return ["REPLIED", "success"];
  if (outreach?.status === "FOLLOW_UP_DUE") return ["FOLLOW UP", "warning"];
  if (outreach?.status === "MEETING_BOOKED") return ["MEETING", "success"];
  if (outreach?.status === "NOT_INTERESTED") return ["CLOSED", "danger"];
  if (outreach?.status === "REJECTED") return ["REJECTED", "danger"];
  if (outreach) return [outreach.status || "DRAFTED", "info"];
  if (research?.status === "QUALIFIED") return ["QUALIFIED", "success"];
  if (research?.status === "NEEDS_REVIEW") return ["REVIEW", "warning"];
  if (research?.status === "REJECTED") return ["REJECTED", "danger"];
  return [prospect.status || "SCOUTED", "default"];
}

function render() {
  renderMetrics();
  renderCaseStudy();
  renderApiStatus();
  renderRuns();
  renderProspects();
  renderDetails();
  updateNavCount();
}

function updateNavCount() {
  if (elements.navProspectCount) {
    elements.navProspectCount.textContent = state.prospects.length;
  }
}

function renderApiStatus(message = "") {
  const statusMessage = message || (state.apiOnline
    ? "Connected to State API"
    : isStaticDemo
      ? "Demo mode - showing bundled state"
      : "State API offline");

  if (elements.formStatus) {
    elements.formStatus.textContent = statusMessage;
  }

  if (elements.commandStatus) {
    elements.commandStatus.textContent = state.apiOnline
      ? "All team members ready"
      : isStaticDemo
        ? "Demo mode"
        : "Connect API to enable runs";
  }

  if (elements.statusDot) {
    elements.statusDot.classList.toggle("offline", !state.apiOnline);
  }

  if (elements.statusText) {
    elements.statusText.textContent = state.apiOnline ? "API Connected" : "Demo Mode";
  }

  if (elements.prospectForm) {
    elements.prospectForm.classList.toggle("disabled", !state.apiOnline);
    elements.prospectForm.querySelectorAll("input, textarea, button").forEach((field) => {
      field.disabled = !state.apiOnline;
    });
  }

  document.querySelectorAll("[data-runner]").forEach((button) => {
    button.disabled = !state.apiOnline;
  });

  // Update agent status indicators
  const agentStatuses = ["scoutStatus", "researchStatus", "outreachStatus", "orchestratorStatus"];
  agentStatuses.forEach((id) => {
    const el = document.querySelector(`#${id}`);
    if (el) {
      el.classList.toggle("ready", state.apiOnline);
    }
  });
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
  elements.caseStudyNote.textContent = `${stats.prospects} found, ${stats.qualified} qualified (${stats.qualificationRate}), ${stats.sent} sent, ${stats.meetings} meetings.`;
}

function buildCaseStudySummary() {
  const stats = getCaseStudyStats();
  return `Optima Sales Machine - Case Study

Your AI sales team:
- Scott finds real estate agencies that match your ideal customer
- James researches each prospect and identifies their needs
- Larry writes personalized messages for WhatsApp, email, and LinkedIn
- Ludwig conducts the full pipeline automatically

Current metrics:
- Prospects found: ${stats.prospects}
- Qualified: ${stats.qualified}
- Drafts ready: ${stats.ready}
- Approved: ${stats.approved}
- Sent: ${stats.sent}
- Meetings booked: ${stats.meetings}
- Conversion rate: ${stats.meetingRate}`;
}

function renderRuns() {
  if (!state.runs.length) {
    elements.dailyRuns.innerHTML = `<p class="muted">No agent runs logged yet.</p>`;
    return;
  }

  elements.dailyRuns.innerHTML = state.runs.slice().reverse().slice(0, 3).map((run) => {
    const runType = (run.run_type || "RUN").toLowerCase();
    const time = run.created_at ? formatRelativeTime(run.created_at) : "";
    return `
      <article class="run-card">
        <div class="run-header">
          <div class="run-type">
            <span class="run-type-dot ${runType}"></span>
            ${escapeHtml(run.run_type || "RUN")}
          </div>
          <span class="run-time">${escapeHtml(time)}</span>
        </div>
        <p class="run-source">${escapeHtml(run.source_name || run.agent_base || "Agent run")}</p>
        <div class="run-stats">
          ${run.candidates_seen ? `<span class="run-stat"><strong>${escapeHtml(run.candidates_seen)}</strong> seen</span>` : ""}
          ${run.prospects_added ? `<span class="run-stat"><strong>${escapeHtml(run.prospects_added.length)}</strong> added</span>` : ""}
          ${run.research_added ? `<span class="run-stat"><strong>${escapeHtml(run.research_added.length)}</strong> briefs</span>` : ""}
          ${run.drafts_added ? `<span class="run-stat"><strong>${escapeHtml(run.drafts_added.length)}</strong> drafts</span>` : ""}
          ${run.duplicates_skipped ? `<span class="run-stat"><strong>${escapeHtml(run.duplicates_skipped.length)}</strong> skipped</span>` : ""}
        </div>
      </article>
    `;
  }).join("");
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function renderProspects() {
  if (!state.prospects.length) {
    elements.prospectList.innerHTML = `<p class="muted" style="padding:12px">No prospects yet. Add one to get started.</p>`;
    return;
  }

  elements.prospectList.innerHTML = state.prospects.map((prospect) => {
    const [tag, tone] = statusTag(prospect);
    return `
      <button class="prospect-card ${prospect.prospect_id === state.selectedId ? "active" : ""}" data-id="${escapeHtml(prospect.prospect_id)}" type="button">
        <div class="prospect-name">${escapeHtml(prospect.company_name)}</div>
        <div class="prospect-meta">
          <span class="prospect-meta-item">${escapeHtml(prospect.location || "Unknown")}</span>
          <span class="prospect-meta-item">${escapeHtml(prospect.listing_count_estimate ? `${prospect.listing_count_estimate} listings` : "")}</span>
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
        <p>Choose a prospect to view the multi-agent workflow.</p>
      </div>
    `;
    return;
  }

  const research = findResearch(prospect.prospect_id);
  const outreach = findOutreach(prospect.prospect_id);
  const score = research?.qualification_score ?? "-";

  elements.detailPanel.innerHTML = `
    <div class="detail-header">
      <div class="detail-header-content">
        <div class="detail-eyebrow">
          <span class="detail-source">${escapeHtml(prospect.source || "Source")}</span>
        </div>
        <h2 class="detail-title">${escapeHtml(prospect.company_name)}</h2>
        <p class="detail-subtitle">${escapeHtml(prospect.why_flagged || "No scout note yet.")}</p>
      </div>
      <div class="score-badge">${escapeHtml(score)}</div>
    </div>

    <div class="detail-content">
      <div class="detail-grid">
        ${infoCard("Scout Output", [
          ["Location", prospect.location],
          ["Listings", prospect.listing_count_estimate || "Unknown"],
          ["Contacts", prospect.contact_paths?.join(", ") || "None"],
          ["Confidence", prospect.confidence]
        ])}

        ${research ? infoCard("Research Brief", [
          ["Summary", research.summary],
          ["Activity", research.estimated_activity],
          ["CRM Signals", research.crm_signals?.join(", ") || "None"],
          ["Competitors", research.competitor_signals?.join(", ") || "None"],
          ["Angle", research.outreach_angle]
        ]) : emptyCard("Research Brief", "Waiting for James to research.")}

        ${research ? listCard("Pain Points", research.pain_points) : emptyCard("Pain Points", "James has not identified pain points yet.")}
        ${research ? listCard("Sources", research.sources?.length ? research.sources : ["No sources saved yet."]) : emptyCard("Sources", "James has not saved sources yet.")}
      </div>

      <div class="drafts-section">
        ${outreach ? renderDrafts(outreach) : emptyCard("Outreach Drafts", "Waiting for Larry to write drafts.")}
      </div>
    </div>
  `;
}

function infoCard(title, rows) {
  return `
    <article class="info-card">
      <h3 class="info-card-title">${escapeHtml(title)}</h3>
      <div class="info-card-content">
        ${rows.map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value || "Unknown")}</p>`).join("")}
      </div>
    </article>
  `;
}

function listCard(title, items = []) {
  return `
    <article class="info-card">
      <h3 class="info-card-title">${escapeHtml(title)}</h3>
      <div class="info-card-content">
        <ul>
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
    </article>
  `;
}

function emptyCard(title, message) {
  return `
    <article class="info-card">
      <h3 class="info-card-title">${escapeHtml(title)}</h3>
      <div class="info-card-content">
        <p>${escapeHtml(message)}</p>
      </div>
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
    <div class="drafts-header">
      <div class="drafts-header-left">
        <h3>Outreach Drafts</h3>
        <p>Status: <strong>${escapeHtml(draft.status || "OUTREACH_DRAFTED")}</strong></p>
      </div>
      <div class="draft-actions">
        <button class="draft-btn primary" data-action="approve-draft" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${isApproved || isSent || !state.apiOnline ? "disabled" : ""}>
          ${isApproved || isSent ? "Approved" : "Approve"}
        </button>
        <button class="draft-btn danger" data-action="reject-draft" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${isRejected || isSent || !state.apiOnline ? "disabled" : ""}>
          ${isRejected ? "Rejected" : "Reject"}
        </button>
        <button class="draft-btn" data-action="mark-sent" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${!isApproved || isSent || isRejected || !state.apiOnline ? "disabled" : ""}>
          ${isSent || isReplied || isFollowUpDue ? "Sent" : "Mark Sent"}
        </button>
        <button class="draft-btn success" data-action="mark-replied" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${(!isSent && !isFollowUpDue) || isReplied || isRejected || isClosed || !state.apiOnline ? "disabled" : ""}>
          ${isReplied || isMeetingBooked ? "Replied" : "Set Replied"}
        </button>
        <button class="draft-btn warning" data-action="follow-up" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${!isSent || isReplied || isFollowUpDue || isRejected || isClosed || !state.apiOnline ? "disabled" : ""}>
          ${isFollowUpDue ? "Follow-up Due" : "Follow Up"}
        </button>
      </div>
    </div>
    ${renderOutcomeControls(draft)}
    ${renderMeetingControls(draft)}
    <div class="draft-channels">
      <article class="draft-channel">
        <div class="draft-channel-header">
          <h4>WhatsApp</h4>
          <button class="copy-btn" data-action="copy-draft" data-copy-text="${escapeHtml(displayRawText(draft.whatsapp || ""))}" type="button">Copy</button>
        </div>
        <div class="draft-channel-content">
          <p>${displayText(draft.whatsapp || "No WhatsApp draft yet.")}</p>
        </div>
      </article>
      <article class="draft-channel">
        <div class="draft-channel-header">
          <h4>Email</h4>
          <button class="copy-btn" data-action="copy-draft" data-copy-text="${escapeHtml(formatEmailCopy(draft))}" type="button">Copy</button>
        </div>
        <div class="draft-channel-content">
          <p class="subject">${escapeHtml(draft.email_subject || "No subject")}</p>
          <p>${displayText(draft.email_body || "No email body yet.")}</p>
        </div>
      </article>
      <article class="draft-channel">
        <div class="draft-channel-header">
          <h4>LinkedIn</h4>
          <button class="copy-btn" data-action="copy-draft" data-copy-text="${escapeHtml(displayRawText(draft.linkedin_dm || ""))}" type="button">Copy</button>
        </div>
        <div class="draft-channel-content">
          <p>${displayText(draft.linkedin_dm || "No LinkedIn draft yet.")}</p>
        </div>
      </article>
    </div>
  `;
}

function renderOutcomeControls(draft) {
  const canLogOutcome = ["REPLIED", "FOLLOW_UP_DUE", "MEETING_BOOKED"].includes(draft.status);
  if (!canLogOutcome && !draft.response_note) return "";

  return `
    <div class="outcome-block">
      <h3>Response Outcome</h3>
      <p>${escapeHtml(draft.response_note || "No response note saved yet.")}</p>
      <textarea data-role="response-note" rows="3" placeholder="Paste the reply or next-step note">${escapeHtml(draft.response_note || "")}</textarea>
      <div class="draft-actions">
        <button class="draft-btn" data-action="save-note" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${!state.apiOnline ? "disabled" : ""}>Save Note</button>
        <button class="draft-btn success" data-action="meeting-booked" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${!canLogOutcome || !state.apiOnline ? "disabled" : ""}>Meeting Booked</button>
        <button class="draft-btn danger" data-action="not-interested" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${!canLogOutcome || !state.apiOnline ? "disabled" : ""}>Not Interested</button>
      </div>
    </div>
  `;
}

function renderMeetingControls(draft) {
  if (draft.status !== "MEETING_BOOKED") return "";

  return `
    <div class="outcome-block">
      <h3>Meeting Prep</h3>
      <p>${escapeHtml(draft.meeting_details || "Add date, attendee, objective, and what to prepare.")}</p>
      <textarea data-role="meeting-details" rows="4" placeholder="Example: Tuesday 10:00. Goal: qualify lead volume and current CRM. Prep: show WhatsApp lead triage demo.">${escapeHtml(draft.meeting_details || "")}</textarea>
      <div class="draft-actions">
        <button class="draft-btn" data-action="save-meeting-details" data-draft-id="${escapeHtml(draft.draft_id)}" type="button" ${!state.apiOnline ? "disabled" : ""}>Save Meeting Prep</button>
      </div>
    </div>
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
    renderApiStatus("Copied to clipboard");
  } catch {
    renderApiStatus("Copy failed. Select text manually.");
  }
}

async function copyCaseStudySummary() {
  try {
    await navigator.clipboard.writeText(buildCaseStudySummary());
    renderApiStatus("Copied case study summary");
  } catch {
    renderApiStatus("Copy failed. Select summary manually.");
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
    toggleForm(false);
    await loadState();
  } catch (error) {
    renderApiStatus(error.message);
  }
}

function toggleForm(show) {
  state.formVisible = show ?? !state.formVisible;
  if (elements.prospectForm) {
    elements.prospectForm.style.display = state.formVisible ? "block" : "none";
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

// Event listeners
elements.refreshBtn.addEventListener("click", loadState);
elements.prospectForm.addEventListener("submit", addProspect);
elements.copyCaseStudyBtn.addEventListener("click", copyCaseStudySummary);

if (elements.toggleFormBtn) {
  elements.toggleFormBtn.addEventListener("click", () => toggleForm());
}

if (elements.mobileNavToggle) {
  elements.mobileNavToggle.addEventListener("click", () => {
    elements.sidebar.classList.toggle("open");
  });
}

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

// Close sidebar when clicking outside on mobile
document.addEventListener("click", (event) => {
  if (window.innerWidth <= 900 && 
      elements.sidebar.classList.contains("open") && 
      !elements.sidebar.contains(event.target) && 
      !elements.mobileNavToggle.contains(event.target)) {
    elements.sidebar.classList.remove("open");
  }
});

loadState();
