const AIRTABLE_API = "https://api.airtable.com/v0";

const TABLES = {
  ORG_PROFILE: "tbllTzw4lqgmyPIc3",
  BASELINE_SCORES: "tblEyUOd2daJ1tMeu",
  ENDLINE_SCORES: "tblo7cpZsebw9TuNV",
  SMART: "tblHePg3WQAfX9vTN",
  NOTES: "tblFICUlttziIutny",
  CONSULTING: "tblG8VPd93xafzBJ6",
  COACHING: "tblMKZVTSsl9kyuNx",
  CHECKLIST: "tblkIVaKSg0f1PhNs",
  VALIDATION: "tbl05mLuPICPy5DS0",
};

const F = {
  ORG_CODE: "fldOBxNIVjIlQwSFZ",
  ORG_NAME: "fldk28wgiUmfeVXcx",
  CEO_NAME: "fldtINk3uMaArAIfa",
  JURISDICTION: "fldq0wb9LMKO4C61r",
  SECTOR: "fldOxUc6wIAMfrGve",
  EMAIL: "fldZQg3ujM822wZQD",
  INTENSITY: "fld6w9mS9LqGPQjrf",
  TURNOVER: "fldOZsxjgWLp4BFme",
  EMPLOYEES: "fldSGnOxSrsw1eqpB",
  TRADED_PCT: "fldxsu8L5LsRFhDqe",
  CB_PCT: "fld2rddFZslhNkD78",
  ASSESSOR: "fldifVOCs2aDTlGxb",
  PROBLEM: "fldbolARwmijz00Xf",
  OBSERVATION: "fldDkHLvKMVEtH4Kc",
  GOAL1: "fldGnaTHoRCuWSNJK",
  GOAL2: "fldaaYOhxt02Mfx8N",
  GOAL3: "fldVKalunQCTZrqFY",
  PRIORITIES: "fldGfBHxQ5zL896uq",
  CB_BASELINE: "fldUrs1ZBin0pnu4D",
  CB_TARGET: "fld5ebS4shD6ndmpb",
  CB_ENDLINE: "fld486HdK2hxqPQaH",
  BASELINE_LOCKED: "fld8UegLqlAhxOQn5",
  BS_ORG: "fldTH4PXtzyyJ35yC",
  BS_DOMAIN_NUM: "fldMM5I9G3i4HFKmL",
  BS_DOMAIN_NAME: "fldIs8JqfiHJ1Emxj",
  BS_SCORE: "fldBOIswEhIHAlpFn",
  BS_EVIDENCE: "fldWF1rT87UQtgEKN",
  ES_ORG: "fldoIksaEyur96124",
  ES_DOMAIN_NUM: "fldwRuSh771Bi1SWE",
  ES_DOMAIN_NAME: "fldSHkSx901Ze4o7J",
  ES_SCORE: "flduLYjkXNjTqwnfK",
  SM_ORG: "fldYetxVcFRxOoyox",
  SM_NUM: "fldB5AepJvppiWAE6",
  SM_OBJ: "fld6mD3O0kk3GxvDr",
  SM_TARGET: "fldX4BXYRNQPmZjoo",
  SM_TIMELINE: "fldTBkSRQUiZAJ0AE",
  SM_OWNER: "fldgnnZWfCZOeU12z",
  SM_STATUS: "fldRmiYLbYyGpBSSl",
  N_ORG: "fld5R5Xu0w7bsZPPb",
  N_TYPE: "fldBrPnmYAOUGI9qf",
  N_DATE: "fldIqqY9fKfLafcGo",
  N_TEXT: "fldFYEUxCgkotAVTg",
  CO_ORG: "fldE3koHqzOnqHwhy",
  CO_CODE: "fld3YBTTZUt2VXLy3",
  CO_TITLE: "fldmR5cowqQfX08QS",
  CO_DATE: "fldWzbV0mreXDtdvD",
  CO_PHASE: "fldylOXfCmiokQjn9",
  CO_FOCUS: "fldtIZAk5SEv3vJyS",
  CO_BY: "fldm9smbYjDOQesE3",
  CO_FORMAT: "fldJCzjxEiMYyb1eb",
  CO_SMART: "fld7SmYuHofqbNzqX",
  CO_ACTIONS: "fldw7nZ3mK9Qf4GVi",
  CO_OUTPUTS: "fld3DscaQ1sDXMwQN",
  CO_DAYS: "flddbxrbxdP7CdiGW",
  CO_MOVEMENT: "fldGLAYeulkSNmtzk",
  CO_RAG: "fld01grcsg0qm3MpZ",
  CO_DONE: "fldH7pFAoUsMvo1yw",
  CC_ORG: "fldQaizus3nR3QI6z",
  CC_CODE: "fldg8EqYJq8LGjFR0",
  CC_TITLE: "fldOrIFEuW1HuenLZ",
  CC_DATE: "fldFneoUteAcXjNSN",
  CC_COACH: "fldW8TnDSB35zeFYR",
  CC_HOURS: "fldba8eMSzdAy7vH6",
  CC_THEME: "fldwbNtTni2JjyQGo",
  CC_ACTION: "fldGwx6mmgi0f6puG",
  CC_DONE: "fldK6aSrEWZjhwWWs",
  CK_ORG: "flddVrVKnWV8bvRWC",
  CK_PHASE: "fld2UA13cDkcvC0HQ",
  CK_ITEM: "fldPeTeomIkA98Leq",
  CK_INDEX: "fldRVbaA90UkCfCgo",
  CK_DONE: "fld90Gbmsg89z0GgE",
  CK_AT: "fld1ZThZHqezmrXs9",
  V_ORG: "fldGsEK8beYaauLgL",
  V_NUM: "fldu8UjnlsBfqZ780",
  V_TITLE: "flddOCEZdYb0b4drM",
  V_NOTES: "flduAKEA2kyPuZqQP",
};

const DOMAINS = [
  "Revenue, Pricing & Financial Sustainability",
  "Market Strategy & Cross-Border Trade",
  "Value Proposition & Competitive Positioning",
  "Sales Pipeline & Business Development",
  "Leadership & Governance",
  "Organisational Capacity & Delivery",
  "Financial Management & Systems",
  "Digital Capability & Marketing",
  "Impact Measurement & Reporting",
];

const CONSULTING_TEMPLATE = [
  { code: "OR1", title: "Health Check & Problem Identification", date: "4–18 May 2026", phase: "Diagnose", focus: "Deep-dive into commercial assessment; validate baseline; agree problem statement & SMART objectives" },
  { code: "OR2", title: "Commercialisation Plan Progress", date: "12–26 Jun 2026", phase: "Translate", focus: "Confirm scaling barriers, commercial priorities, scenario for change; refine Scale & Change Plan" },
  { code: "OR3", title: "Revenue & Business Model Deep-Dive", date: "10–24 Jul 2026", phase: "Strengthen", focus: "Revenue diversification; income mix; business model innovation; market demand testing" },
  { code: "OR4", title: "Change Management Implementation", date: "14–28 Aug 2026", phase: "Strengthen", focus: "Organisational & commercial change across pricing, cost control, cash-flow, sales processes" },
  { code: "OR5", title: "Financial Systems & Pricing", date: "11–25 Sep 2026", phase: "Strengthen", focus: "Cost structures; pricing assumptions; break-even; cash-flow management; financial dashboards" },
  { code: "OR6", title: "Digital Marketing & Cross-Border", date: "9–23 Oct 2026", phase: "Strengthen", focus: "Value proposition; market positioning; digital channels; cross-border entry planning" },
  { code: "OR7", title: "AI & Technology Adoption", date: "13–27 Nov 2026", phase: "Strengthen", focus: "Operational workflows; low-cost tech solutions; AI tools for finance, marketing, operations" },
  { code: "OR8", title: "Governance & Investment Readiness", date: "14–20 Dec 2026", phase: "Sustain", focus: "Board effectiveness; succession planning; business cases; financial projections; investor materials" },
];

const COACHING_TEMPLATE = [
  { code: "C1", title: "Readiness & Individual Coaching Plans", date: "19–29 May 2026", coach: "Sarah / Aoife", theme: "Leadership baseline; coaching readiness assessment; bespoke coaching plan agreed" },
  { code: "C2", title: "Leadership Effectiveness & Decision-Making", date: "15–29 Jun 2026", coach: "Sarah / Aoife", theme: "Leadership effectiveness; commercial decision-making; prioritisation; resilience & strategic focus" },
  { code: "C3", title: "Leading Change & Behavioural Reinforcement", date: "17–31 Aug 2026", coach: "Sarah / Aoife", theme: "Leading organisational change; reinforcing behavioural change; commercial decision-making" },
  { code: "C4", title: "Market Positioning & Cross-Border Decisions", date: "12 Oct 2026", coach: "Sarah / Aoife", theme: "Communications confidence; market positioning; cross-border decision-making" },
  { code: "C5", title: "Board Leadership & Investment Decisions", date: "15 Dec 2026", coach: "Sarah / Aoife", theme: "Board leadership; succession planning; investor engagement; long-term sustainability" },
];

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function jsonResponse(statusCode, body) {
  return { statusCode, headers: { ...corsHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

async function airtableFetch(path, options = {}) {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${AIRTABLE_API}/${process.env.AIRTABLE_BASE_ID}/${path}${sep}returnFieldsByFieldId=true`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function listAllRecords(tableId) {
  const out = [];
  let offset;
  do {
    const qs = offset ? `?offset=${encodeURIComponent(offset)}` : "";
    const data = await airtableFetch(`${tableId}${qs}`);
    out.push(...data.records);
    offset = data.offset;
  } while (offset);
  return out;
}

function pct(value) {
  if (value === undefined || value === null || value === "") return "";
  const m = String(value).match(/(\d+(?:\.\d+)?)/);
  return m ? m[1] : "";
}

function buildOrgFromAirtable(profile, baseline, endline, smart, notes, consulting, coaching, checklist, validation) {
  const f = profile.fields;
  const orgCode = f[F.ORG_CODE] || profile.id;

  const baselineRows = baseline.filter((r) => r.fields[F.BS_ORG] === orgCode).sort((a, b) => (a.fields[F.BS_DOMAIN_NUM] || 0) - (b.fields[F.BS_DOMAIN_NUM] || 0));
  const endlineRows = endline.filter((r) => r.fields[F.ES_ORG] === orgCode).sort((a, b) => (a.fields[F.ES_DOMAIN_NUM] || 0) - (b.fields[F.ES_DOMAIN_NUM] || 0));
  const smartRows = smart.filter((r) => r.fields[F.SM_ORG] === orgCode).sort((a, b) => (a.fields[F.SM_NUM] || 0) - (b.fields[F.SM_NUM] || 0));
  const noteRows = notes.filter((r) => r.fields[F.N_ORG] === orgCode);
  const consultingRows = consulting.filter((r) => r.fields[F.CO_ORG] === orgCode).sort((a, b) => String(a.fields[F.CO_CODE] || "").localeCompare(String(b.fields[F.CO_CODE] || ""), undefined, { numeric: true }));
  const coachingRows = coaching.filter((r) => r.fields[F.CC_ORG] === orgCode).sort((a, b) => String(a.fields[F.CC_CODE] || "").localeCompare(String(b.fields[F.CC_CODE] || ""), undefined, { numeric: true }));
  const checklistRows = checklist.filter((r) => r.fields[F.CK_ORG] === orgCode).sort((a, b) => (a.fields[F.CK_INDEX] || 0) - (b.fields[F.CK_INDEX] || 0));
  const validationRows = validation.filter((r) => r.fields[F.V_ORG] === orgCode).sort((a, b) => (a.fields[F.V_NUM] || 0) - (b.fields[F.V_NUM] || 0));

  const baselineByNum = {};
  baselineRows.forEach((r) => (baselineByNum[r.fields[F.BS_DOMAIN_NUM]] = r));
  const endlineByNum = {};
  endlineRows.forEach((r) => (endlineByNum[r.fields[F.ES_DOMAIN_NUM]] = r));

  const baselineFull = DOMAINS.map((d, i) => {
    const row = baselineByNum[i + 1];
    return { domain: d, score: row ? row.fields[F.BS_SCORE] ?? "" : "", evidence: row ? row.fields[F.BS_EVIDENCE] ?? "" : "", _rid: row ? row.id : null };
  });
  const endlineFull = DOMAINS.map((d, i) => {
    const row = endlineByNum[i + 1];
    return { domain: d, score: row ? row.fields[F.ES_SCORE] ?? "" : "", _rid: row ? row.id : null };
  });

  const progressItems = noteRows.filter((r) => r.fields[F.N_TYPE] === "Progress").map((r) => ({ month: r.fields[F.N_DATE] || "", text: r.fields[F.N_TEXT] || "", _rid: r.id }));
  const generalNotes = noteRows.filter((r) => r.fields[F.N_TYPE] === "Consulting" || r.fields[F.N_TYPE] === "Coaching" || r.fields[F.N_TYPE] === "Form Submission").map((r) => ({ type: r.fields[F.N_TYPE], date: r.fields[F.N_DATE] || "", text: r.fields[F.N_TEXT] || "", _rid: r.id }));

  return {
    _rid: profile.id,
    name: f[F.ORG_NAME] || "",
    ceo: f[F.CEO_NAME] || "",
    code: orgCode,
    password: orgCode,
    intensity: f[F.INTENSITY] || "",
    assessor: f[F.ASSESSOR] || "",
    kpi: {
      jurisdiction: f[F.JURISDICTION] || "",
      sector: f[F.SECTOR] || "",
      crossBorderPct: f[F.CB_PCT] || "",
      turnoverBand: f[F.TURNOVER] || "",
      employees: f[F.EMPLOYEES] || "",
      tradedPct: f[F.TRADED_PCT] || "",
    },
    diagnosis: {
      problem: f[F.PROBLEM] || "",
      observation: f[F.OBSERVATION] || "",
      goal1: f[F.GOAL1] || "",
      goal2: f[F.GOAL2] || "",
      goal3: f[F.GOAL3] || "",
      priorities: f[F.PRIORITIES] || "",
    },
    crossBorder: {
      baseline: f[F.CB_BASELINE] || "",
      target: f[F.CB_TARGET] || "",
      endline: f[F.CB_ENDLINE] || "",
    },
    baseline: baselineFull,
    endline: endlineFull,
    smart: smartRows.map((r, i) => ({
      objective: r.fields[F.SM_OBJ] || "",
      target: r.fields[F.SM_TARGET] || "",
      timeline: r.fields[F.SM_TIMELINE] || "",
      owner: r.fields[F.SM_OWNER] || "",
      status: r.fields[F.SM_STATUS] || "",
      _rid: r.id,
      _num: r.fields[F.SM_NUM] || i + 1,
    })),
    progress: progressItems,
    notes: generalNotes,
    consulting: consultingRows.map((r) => ({
      code: r.fields[F.CO_CODE] || "",
      title: r.fields[F.CO_TITLE] || "",
      date: r.fields[F.CO_DATE] || "",
      phase: r.fields[F.CO_PHASE] || "",
      focus: r.fields[F.CO_FOCUS] || "",
      consultedBy: r.fields[F.CO_BY] || "",
      format: r.fields[F.CO_FORMAT] || "",
      smartProgressed: r.fields[F.CO_SMART] || "",
      actionsAgreed: r.fields[F.CO_ACTIONS] || "",
      keyOutputs: r.fields[F.CO_OUTPUTS] || "",
      days: r.fields[F.CO_DAYS] || "",
      domainMovement: r.fields[F.CO_MOVEMENT] || "",
      rag: r.fields[F.CO_RAG] || "",
      completed: !!r.fields[F.CO_DONE],
      _rid: r.id,
    })),
    coaching: coachingRows.map((r) => ({
      code: r.fields[F.CC_CODE] || "",
      title: r.fields[F.CC_TITLE] || "",
      date: r.fields[F.CC_DATE] || "",
      coach: r.fields[F.CC_COACH] || "",
      hours: r.fields[F.CC_HOURS] || "",
      theme: r.fields[F.CC_THEME] || "",
      action: r.fields[F.CC_ACTION] || "",
      completed: !!r.fields[F.CC_DONE],
      _rid: r.id,
    })),
    checklist: checklistRows.map((r) => ({
      phase: r.fields[F.CK_PHASE] || "",
      item: r.fields[F.CK_ITEM] || "",
      index: r.fields[F.CK_INDEX] || 0,
      completed: !!r.fields[F.CK_DONE],
      completedAt: r.fields[F.CK_AT] || "",
      _rid: r.id,
    })),
    validation: validationRows.map((r) => ({
      num: r.fields[F.V_NUM] || 0,
      title: r.fields[F.V_TITLE] || "",
      notes: r.fields[F.V_NOTES] || "",
      _rid: r.id,
    })),
    baselineLocked: !!f[F.BASELINE_LOCKED],
  };
}

async function loadAll() {
  const [profiles, baseline, endline, smart, notes, consulting, coaching, checklist, validation] = await Promise.all([
    listAllRecords(TABLES.ORG_PROFILE),
    listAllRecords(TABLES.BASELINE_SCORES),
    listAllRecords(TABLES.ENDLINE_SCORES),
    listAllRecords(TABLES.SMART),
    listAllRecords(TABLES.NOTES),
    listAllRecords(TABLES.CONSULTING),
    listAllRecords(TABLES.COACHING),
    listAllRecords(TABLES.CHECKLIST),
    listAllRecords(TABLES.VALIDATION),
  ]);
  return { profiles, baseline, endline, smart, notes, consulting, coaching, checklist, validation };
}

async function handleList() {
  const all = await loadAll();
  const orgs = all.profiles.map((p) => buildOrgFromAirtable(p, all.baseline, all.endline, all.smart, all.notes, all.consulting, all.coaching, all.checklist, all.validation));
  return jsonResponse(200, { orgs });
}

async function handleGet(orgCode) {
  const all = await loadAll();
  const profile = all.profiles.find((p) => p.fields[F.ORG_CODE] === orgCode);
  if (!profile) return jsonResponse(404, { error: "Org not found" });
  const org = buildOrgFromAirtable(profile, all.baseline, all.endline, all.smart, all.notes, all.consulting, all.coaching, all.checklist, all.validation);
  return jsonResponse(200, { org });
}

async function seedConsultingAndCoaching(orgCode) {
  const consulting = CONSULTING_TEMPLATE.map((c) => ({
    fields: {
      [F.CO_ORG]: orgCode,
      [F.CO_CODE]: c.code,
      [F.CO_TITLE]: c.title,
      [F.CO_DATE]: c.date,
      [F.CO_PHASE]: c.phase,
      [F.CO_FOCUS]: c.focus,
    },
  }));
  for (let i = 0; i < consulting.length; i += 10) {
    await airtableFetch(TABLES.CONSULTING, { method: "POST", body: JSON.stringify({ records: consulting.slice(i, i + 10) }) });
  }
  const coaching = COACHING_TEMPLATE.map((c) => ({
    fields: {
      [F.CC_ORG]: orgCode,
      [F.CC_CODE]: c.code,
      [F.CC_TITLE]: c.title,
      [F.CC_DATE]: c.date,
      [F.CC_COACH]: c.coach,
      [F.CC_THEME]: c.theme,
    },
  }));
  for (let i = 0; i < coaching.length; i += 10) {
    await airtableFetch(TABLES.COACHING, { method: "POST", body: JSON.stringify({ records: coaching.slice(i, i + 10) }) });
  }
}

async function handleCreate(payload) {
  const { name, ceo, code, jurisdiction } = payload;
  if (!name || !ceo || !code) return jsonResponse(400, { error: "name, ceo, code are required" });
  const fields = {
    [F.ORG_CODE]: code,
    [F.ORG_NAME]: name,
    [F.CEO_NAME]: ceo,
    [F.JURISDICTION]: jurisdiction || "ROI",
  };
  await airtableFetch(TABLES.ORG_PROFILE, { method: "POST", body: JSON.stringify({ records: [{ fields }] }) });
  try {
    await seedConsultingAndCoaching(code);
  } catch (err) {
    console.error("[SELECT API] Seed error (org still created):", err);
  }
  return jsonResponse(200, { ok: true, code });
}

async function handleRemove(orgCode) {
  const profiles = await listAllRecords(TABLES.ORG_PROFILE);
  const target = profiles.find((p) => p.fields[F.ORG_CODE] === orgCode);
  if (!target) return jsonResponse(404, { error: "Org not found" });
  await airtableFetch(`${TABLES.ORG_PROFILE}/${target.id}`, { method: "DELETE" });
  return jsonResponse(200, { ok: true });
}

async function patchProfile(profileId, fields) {
  if (!Object.keys(fields).length) return;
  await airtableFetch(TABLES.ORG_PROFILE, { method: "PATCH", body: JSON.stringify({ records: [{ id: profileId, fields }] }) });
}

async function batchUpdate(tableId, updates) {
  for (let i = 0; i < updates.length; i += 10) {
    await airtableFetch(tableId, { method: "PATCH", body: JSON.stringify({ records: updates.slice(i, i + 10) }) });
  }
}

async function batchCreate(tableId, creates) {
  for (let i = 0; i < creates.length; i += 10) {
    await airtableFetch(tableId, { method: "POST", body: JSON.stringify({ records: creates.slice(i, i + 10) }) });
  }
}

async function batchDelete(tableId, ids) {
  for (let i = 0; i < ids.length; i += 10) {
    const batch = ids.slice(i, i + 10);
    const qs = batch.map((id) => `records[]=${id}`).join("&");
    await airtableFetch(`${tableId}?${qs}`, { method: "DELETE" });
  }
}

async function handleUpdate(payload) {
  const { code, kpi, diagnosis, crossBorder, baseline, endline, smart, progress, notes, consulting, coaching, checklist, validation, baselineLocked, intensity, assessor } = payload;
  if (!code) return jsonResponse(400, { error: "code is required" });

  const profiles = await listAllRecords(TABLES.ORG_PROFILE);
  const profile = profiles.find((p) => p.fields[F.ORG_CODE] === code);
  if (!profile) return jsonResponse(404, { error: "Org not found" });

  const profileFields = {};
  if (kpi) {
    if (kpi.jurisdiction !== undefined) profileFields[F.JURISDICTION] = kpi.jurisdiction;
    if (kpi.sector !== undefined) profileFields[F.SECTOR] = kpi.sector;
    if (kpi.crossBorderPct !== undefined) profileFields[F.CB_PCT] = pct(kpi.crossBorderPct);
    if (kpi.turnoverBand !== undefined) profileFields[F.TURNOVER] = String(kpi.turnoverBand);
    if (kpi.employees !== undefined) profileFields[F.EMPLOYEES] = String(kpi.employees);
    if (kpi.tradedPct !== undefined) profileFields[F.TRADED_PCT] = pct(kpi.tradedPct);
  }
  if (diagnosis) {
    if (diagnosis.problem !== undefined) profileFields[F.PROBLEM] = diagnosis.problem;
    if (diagnosis.observation !== undefined) profileFields[F.OBSERVATION] = diagnosis.observation;
    if (diagnosis.goal1 !== undefined) profileFields[F.GOAL1] = diagnosis.goal1;
    if (diagnosis.goal2 !== undefined) profileFields[F.GOAL2] = diagnosis.goal2;
    if (diagnosis.goal3 !== undefined) profileFields[F.GOAL3] = diagnosis.goal3;
    if (diagnosis.priorities !== undefined) profileFields[F.PRIORITIES] = diagnosis.priorities;
  }
  if (crossBorder) {
    if (crossBorder.baseline !== undefined) profileFields[F.CB_BASELINE] = crossBorder.baseline;
    if (crossBorder.target !== undefined) profileFields[F.CB_TARGET] = crossBorder.target;
    if (crossBorder.endline !== undefined) profileFields[F.CB_ENDLINE] = crossBorder.endline;
  }
  if (intensity !== undefined) profileFields[F.INTENSITY] = intensity;
  if (assessor !== undefined) profileFields[F.ASSESSOR] = assessor;
  if (baselineLocked !== undefined) profileFields[F.BASELINE_LOCKED] = !!baselineLocked;
  await patchProfile(profile.id, profileFields);

  if (Array.isArray(baseline)) {
    const existing = await listAllRecords(TABLES.BASELINE_SCORES);
    const byNum = {};
    existing.filter((r) => r.fields[F.BS_ORG] === code).forEach((r) => (byNum[r.fields[F.BS_DOMAIN_NUM]] = r));
    const ops = [];
    baseline.forEach((b, i) => {
      const num = i + 1;
      const score = b.score === "" || b.score === null || b.score === undefined ? null : parseFloat(b.score);
      const fields = { [F.BS_ORG]: code, [F.BS_DOMAIN_NUM]: num, [F.BS_DOMAIN_NAME]: DOMAINS[i] };
      if (score !== null && !isNaN(score)) fields[F.BS_SCORE] = score;
      if (b.evidence !== undefined) fields[F.BS_EVIDENCE] = b.evidence;
      const exists = byNum[num];
      if (exists) ops.push({ id: exists.id, fields });
      else if (score !== null || b.evidence) ops.push({ fields });
    });
    await batchUpdate(TABLES.BASELINE_SCORES, ops.filter((o) => o.id));
    await batchCreate(TABLES.BASELINE_SCORES, ops.filter((o) => !o.id));
  }

  if (Array.isArray(endline)) {
    const existing = await listAllRecords(TABLES.ENDLINE_SCORES);
    const byNum = {};
    existing.filter((r) => r.fields[F.ES_ORG] === code).forEach((r) => (byNum[r.fields[F.ES_DOMAIN_NUM]] = r));
    const ops = [];
    endline.forEach((e, i) => {
      const num = i + 1;
      const score = e.score === "" || e.score === null || e.score === undefined ? null : parseFloat(e.score);
      const fields = { [F.ES_ORG]: code, [F.ES_DOMAIN_NUM]: num, [F.ES_DOMAIN_NAME]: DOMAINS[i] };
      if (score !== null && !isNaN(score)) fields[F.ES_SCORE] = score;
      const exists = byNum[num];
      if (exists) ops.push({ id: exists.id, fields });
      else if (score !== null) ops.push({ fields });
    });
    await batchUpdate(TABLES.ENDLINE_SCORES, ops.filter((o) => o.id));
    await batchCreate(TABLES.ENDLINE_SCORES, ops.filter((o) => !o.id));
  }

  if (Array.isArray(smart)) {
    const existing = await listAllRecords(TABLES.SMART);
    const toDelete = existing.filter((r) => r.fields[F.SM_ORG] === code).map((r) => r.id);
    await batchDelete(TABLES.SMART, toDelete);
    const creates = smart.map((s, i) => ({
      fields: {
        [F.SM_ORG]: code,
        [F.SM_NUM]: i + 1,
        [F.SM_OBJ]: s.objective || "",
        [F.SM_TARGET]: s.target || "",
        [F.SM_TIMELINE]: s.timeline || "",
        [F.SM_OWNER]: s.owner || "",
        [F.SM_STATUS]: s.status || "",
      },
    }));
    await batchCreate(TABLES.SMART, creates);
  }

  if (Array.isArray(consulting)) {
    const existing = await listAllRecords(TABLES.CONSULTING);
    const byCode = {};
    existing.filter((r) => r.fields[F.CO_ORG] === code).forEach((r) => (byCode[r.fields[F.CO_CODE]] = r));
    const updates = [];
    const creates = [];
    consulting.forEach((c) => {
      const fields = {
        [F.CO_ORG]: code,
        [F.CO_CODE]: c.code || "",
        [F.CO_TITLE]: c.title || "",
        [F.CO_DATE]: c.date || "",
        [F.CO_PHASE]: c.phase || "",
        [F.CO_FOCUS]: c.focus || "",
        [F.CO_BY]: c.consultedBy || "",
        [F.CO_FORMAT]: c.format || "",
        [F.CO_SMART]: c.smartProgressed || "",
        [F.CO_ACTIONS]: c.actionsAgreed || "",
        [F.CO_OUTPUTS]: c.keyOutputs || "",
        [F.CO_DAYS]: c.days || "",
        [F.CO_MOVEMENT]: c.domainMovement || "",
        [F.CO_RAG]: c.rag || "",
        [F.CO_DONE]: !!c.completed,
      };
      const exists = byCode[c.code];
      if (exists) updates.push({ id: exists.id, fields });
      else creates.push({ fields });
    });
    await batchUpdate(TABLES.CONSULTING, updates);
    await batchCreate(TABLES.CONSULTING, creates);
  }

  if (Array.isArray(coaching)) {
    const existing = await listAllRecords(TABLES.COACHING);
    const byCode = {};
    existing.filter((r) => r.fields[F.CC_ORG] === code).forEach((r) => (byCode[r.fields[F.CC_CODE]] = r));
    const updates = [];
    const creates = [];
    coaching.forEach((c) => {
      const fields = {
        [F.CC_ORG]: code,
        [F.CC_CODE]: c.code || "",
        [F.CC_TITLE]: c.title || "",
        [F.CC_DATE]: c.date || "",
        [F.CC_COACH]: c.coach || "",
        [F.CC_HOURS]: c.hours || "",
        [F.CC_THEME]: c.theme || "",
        [F.CC_ACTION]: c.action || "",
        [F.CC_DONE]: !!c.completed,
      };
      const exists = byCode[c.code];
      if (exists) updates.push({ id: exists.id, fields });
      else creates.push({ fields });
    });
    await batchUpdate(TABLES.COACHING, updates);
    await batchCreate(TABLES.COACHING, creates);
  }

  if (Array.isArray(checklist)) {
    const existing = await listAllRecords(TABLES.CHECKLIST);
    const byIdx = {};
    existing.filter((r) => r.fields[F.CK_ORG] === code).forEach((r) => (byIdx[r.fields[F.CK_INDEX]] = r));
    const updates = [];
    const creates = [];
    checklist.forEach((c) => {
      const fields = {
        [F.CK_ORG]: code,
        [F.CK_PHASE]: c.phase || "",
        [F.CK_ITEM]: c.item || "",
        [F.CK_INDEX]: c.index,
        [F.CK_DONE]: !!c.completed,
        [F.CK_AT]: c.completedAt || "",
      };
      const exists = byIdx[c.index];
      if (exists) updates.push({ id: exists.id, fields });
      else creates.push({ fields });
    });
    await batchUpdate(TABLES.CHECKLIST, updates);
    await batchCreate(TABLES.CHECKLIST, creates);
  }

  if (Array.isArray(validation)) {
    const existing = await listAllRecords(TABLES.VALIDATION);
    const byNum = {};
    existing.filter((r) => r.fields[F.V_ORG] === code).forEach((r) => (byNum[r.fields[F.V_NUM]] = r));
    const updates = [];
    const creates = [];
    validation.forEach((v) => {
      const fields = {
        [F.V_ORG]: code,
        [F.V_NUM]: v.num,
        [F.V_TITLE]: v.title || "",
        [F.V_NOTES]: v.notes || "",
      };
      const exists = byNum[v.num];
      if (exists) updates.push({ id: exists.id, fields });
      else creates.push({ fields });
    });
    await batchUpdate(TABLES.VALIDATION, updates);
    await batchCreate(TABLES.VALIDATION, creates);
  }

  if (Array.isArray(progress) || Array.isArray(notes)) {
    const existingNotes = await listAllRecords(TABLES.NOTES);
    const toDelete = existingNotes
      .filter((r) => r.fields[F.N_ORG] === code)
      .filter((r) => {
        const t = r.fields[F.N_TYPE];
        if (Array.isArray(progress) && Array.isArray(notes)) return t === "Progress" || t === "Consulting" || t === "Coaching";
        if (Array.isArray(progress)) return t === "Progress";
        if (Array.isArray(notes)) return t === "Consulting" || t === "Coaching";
        return false;
      })
      .map((r) => r.id);
    await batchDelete(TABLES.NOTES, toDelete);

    const creates = [];
    if (Array.isArray(progress)) {
      progress.forEach((p) => {
        creates.push({ fields: { [F.N_ORG]: code, [F.N_TYPE]: "Progress", [F.N_DATE]: p.month || "", [F.N_TEXT]: p.text || "" } });
      });
    }
    if (Array.isArray(notes)) {
      notes.forEach((n) => {
        if (n.type === "Form Submission") return;
        creates.push({ fields: { [F.N_ORG]: code, [F.N_TYPE]: n.type === "Coaching" ? "Coaching" : "Consulting", [F.N_DATE]: n.date || "", [F.N_TEXT]: n.text || "" } });
      });
    }
    await batchCreate(TABLES.NOTES, creates);
  }

  return jsonResponse(200, { ok: true });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: corsHeaders(), body: "" };
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });
  if (!process.env.AIRTABLE_PAT || !process.env.AIRTABLE_BASE_ID) return jsonResponse(500, { error: "Server misconfigured — missing env vars" });

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch (e) { return jsonResponse(400, { error: "Invalid JSON" }); }

const masterPw = process.env.TRACKER_MASTER_PW || "SELECT2026";
const authHeader = event.headers['x-auth'] || event.headers['X-Auth'] || '';
const isAssessor = body.password === masterPw || authHeader === masterPw;
const writeActions = new Set(["create", "update", "remove", "seed"]);
if (writeActions.has(body.action) && !isAssessor) return jsonResponse(403, { error: "Assessor password required for this action" });

  try {
    switch (body.action) {
      case "list": return await handleList();
      case "get": return await handleGet(body.code);
      case "create": return await handleCreate(body);
      case "update": return await handleUpdate(body);
      case "remove": return await handleRemove(body.code);
      case "seed": {
        // Seed consulting+coaching templates for an existing org
        const code = body.code;
        if (!code) return jsonResponse(400, { error: "code is required" });
        // Check if already seeded
        const existing = await listAllRecords(TABLES.CONSULTING);
        const hasCycles = existing.some((r) => r.fields[F.CO_ORG] === code);
        if (!hasCycles) {
          await seedConsultingAndCoaching(code);
        }
        return jsonResponse(200, { ok: true, seeded: !hasCycles });
      }
      default: return jsonResponse(400, { error: `Unknown action: ${body.action}` });
    }
  } catch (err) {
    console.error("[SELECT API] Error:", err);
    return jsonResponse(500, { error: err.message });
  }
};
