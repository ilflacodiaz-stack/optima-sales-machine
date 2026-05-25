import {
  appendRecord,
  buildOutreachDraft,
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

function firstPainPoint(brief) {
  return brief.pain_points?.[0] || "responder y calificar consultas más rápido";
}

function shortActivity(brief) {
  const text = brief.estimated_activity || "actividad inmobiliaria visible";
  const listingMatch = text.match(/(\d+)\s+(?:Zonaprop\s+)?(?:purchase\s+)?(?:estimated\s+)?(?:listings|inmuebles|propiedades)/i);
  if (listingMatch) return `más de ${listingMatch[1]} publicaciones visibles`;
  return text
    .replace(/^Scout estimate:\s*/i, "")
    .replace(/\s*so portal counts should be treated as source estimates\.?/i, "")
    .replace(/\.\./g, ".")
    .trim();
}

function buildDraftFromBrief(brief) {
  const activity = shortActivity(brief);
  const pain = firstPainPoint(brief).replace(/\.$/, "").toLowerCase();
  const angle = brief.outreach_angle || "Mejorar respuesta y calificación de consultas inmobiliarias.";
  const company = brief.company_name;

  return buildOutreachDraft({
    prospect_id: brief.prospect_id,
    company_name: company,
    angle,
    whatsapp: `Hola, ¿cómo estás? Vi ${company} y me llamó la atención que tienen ${activity}. En Optima estamos armando agentes de IA para inmobiliarias que responden consultas de portales/WhatsApp, califican interesados y ordenan el seguimiento. Creo que podría ayudar con ${pain}. ¿Te sirve que te comparta un ejemplo corto?`,
    email_subject: `Consultas y seguimiento en ${company}`,
    email_body: `Hola, ¿cómo estás?\n\nEstuve mirando ${company} y vi que tienen ${activity}.\n\nEn Optima trabajamos con agentes de IA para inmobiliarias que ayudan a responder consultas de portales y WhatsApp, calificar interesados y dejar el seguimiento ordenado para el asesor.\n\nPor lo que vi, el ángulo más interesante sería mejorar la velocidad de respuesta y la calificación inicial sin perder el trato personal.\n\n¿Te sirve que te comparta un ejemplo breve aplicado a una inmobiliaria con un flujo de consultas similar?`,
    linkedin_dm: `Hola, vi ${company} y me pareció interesante la actividad que tienen. Estoy trabajando en Optima con agentes de IA para inmobiliarias, enfocados en respuesta y calificación de leads de portales/WhatsApp. ¿Te puedo compartir un ejemplo corto?`,
    personalization_notes: [
      "Draft generated from James-style research brief",
      `Referenced activity: ${activity}`,
      `Used angle: ${angle}`
    ],
    risk_notes: [
      "Review source-specific claims before sending",
      "Do not imply CRM absence unless verified directly"
    ]
  });
}

async function appendRun(record) {
  const runs = await readJson(files.runs);
  runs.push(record);
  await writeJson(files.runs, runs);
  return record;
}

async function runOutreach({ limit }) {
  const [research, outreach] = await Promise.all([
    readJson(files.research),
    readJson(files.outreach)
  ]);
  const existingDraftIds = new Set(outreach.map((draft) => draft.prospect_id));
  const targets = research
    .filter((brief) => brief.status === "QUALIFIED" && !existingDraftIds.has(brief.prospect_id))
    .slice(0, limit);

  const added = [];
  for (const brief of targets) {
    added.push(await appendRecord("outreach", buildDraftFromBrief(brief)));
  }

  const run = await appendRun({
    run_id: `outreach-${Date.now()}`,
    run_type: "OUTREACH",
    prospects_seen: targets.length,
    drafts_added: added.map((draft) => draft.draft_id),
    status: "COMPLETED",
    created_at: now()
  });

  return {
    run_id: run.run_id,
    prospects_seen: targets.length,
    drafts_added: added.length,
    added
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runOutreach({
      limit: Number(getArg("limit", "3")) || 3
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}

export { runOutreach };
