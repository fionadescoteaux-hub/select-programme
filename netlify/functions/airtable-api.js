// SELECT Programme — Airtable API Function
// Version: 2026-05-21-v8 (RAG rationale + Domain N/A fields added to consulting cycles)
// If you see this version logged at startup, the deploy is live.
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
  ATTENDANCE: "tbl4zny0FtKjofM44",
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
  BASELINE_NOTES: "fldIxpNkCRpdtsc7O",
  BASELINE_REPORT_URL: "fldgWfVtyPV160vxL",
  // ── New fields (Phase 1) ──
  NEW_TO_ITI: "fldGjr9YiJ2ufglnJ",
  FIRST_TIME_CB: "fld150A4iIyzD3gPF",
  FIRST_TIME_EXP: "fldUDKLRJbNjcxJy0",
  PRIOR_ITI: "fld4EzTkthjupixfb",
  CB_TARGET_TEXT: "fldEUUVF4265HRDBv",
  SCENARIO: "fld6GiO46JuElatnw",
  CONSTRAINT_1: "fld7E1LGvKIWXGGQ6",
  CONSTRAINT_2: "fldQZsvhEhr3oxb25",
  CONSTRAINT_3: "fld0QMQmG0wW0WmKn",
  BL_TURNOVER: "fldqdcaEXsW9uO6PZ",
  BL_TRADED_INCOME: "fldXswX25yUEqmzoZ",
  BL_TRADED_PCT: "fld9bN9Pd4B0wit4b",
  BL_OP_SURPLUS: "fldk2CSpkVyUCdSlv",
  BL_CASH_POSITION: "fldMWlAWk9iZljTIk",
  BL_RUNWAY: "fldzODkNhTZDSnFkg",
  BL_CB_SALES_PCT: "fldn55zsjvugpwEvm",
  BL_CB_SALES_VAL: "fldwyxaFzoQ7xDC21",
  BL_EXPORT_STATUS: "fldILjtjKFJpBhaLj",
  CUR_TURNOVER: "fld2ZQYWnHTatorsd",
  CUR_TRADED_INCOME: "fldLjrFbMs6q5nrHI",
  CUR_TRADED_PCT: "fld5l4zGso4Ol4Tbq",
  CUR_OP_SURPLUS: "flduYkAdrylcV1wkb",
  CUR_CB_SALES_PCT: "fldXwPlm1c9p6yBj2",
  CUR_CB_SALES_VAL: "fld74x2gHNlcfHs1b",
  CUR_AS_OF: "fldehwAvZ85J6BgIO",
  LCI_BASELINE: "fld1S3LWyDx1kUzdy",
  LCI_MIDPOINT: "fldLiN2e5PgUeNdZc",
  LCI_ENDLINE: "fldoeCnT7aZ8ZMQdI",
  LOCK_LK1: "fldUp9Yd2P3PXVSRV",
  LOCK_LK2: "fldr7ms1yhaCKiF0H",
  LOCK_LK3: "fldudHcAc7c4CoYdA",
  LOCK_LK4: "fldSDFqzfIx6FmB2G",
  LOCK_LED: "fldzPJNlmeog2nv1F",
  LOCK_SESSION_DATE: "fldw4kJTU7ceS1Tmw",
  LOCK_LOCK_DATE: "fldB4C3EUBen1SqLR",
  // ── Existing per-row table fields ──
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
  CO_RATIONALE: "fldodXZQQPb9Wsjw3",
  CO_DOMAIN_NA: "fldmwgb0mlIhfCSB7",
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
  // ── New ATTENDANCE table ──
  AT_ORG: "fldmXijh7JUIRDRRT",
  AT_CODE: "fldtcqTC7KAzCrEyf",
  AT_TITLE: "fldbRoY1cAnFuMcaM",
  AT_DATE: "fldURPtH54JHH2h5k",
  AT_PHASE: "fldnG7Rd7SvIaBq1g",
  AT_ATTENDED: "fldVIVVZVP6kQV3Hq",
  AT_APOLOGY: "fldhpYfCTMv7I0apK",
  AT_FORMAT: "fldu6YT6IvUAGb5Q5",
  AT_NOTES: "fldoRU1pT3dffHiWi",
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

// For Single Select / Multi Select fields: empty strings cause Airtable to try
// to CREATE a blank option, which fails with INVALID_MULTIPLE_CHOICE_OPTIONS.
// Use this to convert "" to null (which Airtable accepts as "clear the field").
function selectVal(v) {
  if (v === undefined || v === null) return undefined; // skip the field entirely
  const s = String(v).trim();
  if (s === "") return null; // explicitly clear
  return s;
}

function buildOrgFromAirtable(profile, baseline, endline, smart, notes, consulting, coaching, checklist, validation, attendance) {
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
  const attendanceRows = (attendance || []).filter((r) => r.fields[F.AT_ORG] === orgCode).sort((a, b) => String(a.fields[F.AT_CODE] || "").localeCompare(String(b.fields[F.AT_CODE] || ""), undefined, { numeric: true }));

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

  // Build rich assessor object expected by Validation tab
  const assessorObj = {
    assessor: f[F.ASSESSOR] || "",
    checklist: {},
    validation: {},
    goals: {
      g_problem: f[F.PROBLEM] || "",
      g_problem_why: "",
      g_goal1: f[F.GOAL1] || "",
      g_goal2: f[F.GOAL2] || "",
      g_goal3: f[F.GOAL3] || "",
      g_smart1: "",
      g_smart2: "",
      g_smart3: "",
    },
    priorities: f[F.PRIORITIES] ? String(f[F.PRIORITIES]).split(",").map((s) => s.trim()).filter(Boolean) : [],
    lock: {
      lk1: !!f[F.LOCK_LK1],
      lk2: !!f[F.LOCK_LK2],
      lk3: !!f[F.LOCK_LK3],
      lk4: !!f[F.LOCK_LK4],
      lk_led: f[F.LOCK_LED] || "",
      lk_session_date: f[F.LOCK_SESSION_DATE] || "",
      lk_lock_date: f[F.LOCK_LOCK_DATE] || "",
    },
  };
  // Fill checklist + ts from CHECKLIST table rows
  checklistRows.forEach((r) => {
    const idx = r.fields[F.CK_INDEX];
    const key = "ck" + idx;
    assessorObj.checklist[key] = !!r.fields[F.CK_DONE];
    if (r.fields[F.CK_AT]) assessorObj.checklist[key + "_ts"] = r.fields[F.CK_AT];
  });
  // Fill validation notes from VALIDATION table rows
  validationRows.forEach((r) => {
    const num = r.fields[F.V_NUM];
    if (num) assessorObj.validation["vn" + num] = r.fields[F.V_NOTES] || "";
  });

  return {
    _rid: profile.id,
    name: f[F.ORG_NAME] || "",
    ceo: f[F.CEO_NAME] || "",
    code: orgCode,
    password: orgCode,
    intensity: f[F.INTENSITY] || "",
    baselineNotes: f[F.BASELINE_NOTES] || "",
    baselineReportUrl: f[F.BASELINE_REPORT_URL] || "",
    assessor: assessorObj,
    kpi: {
      jurisdiction: f[F.JURISDICTION] || "",
      sector: f[F.SECTOR] || "",
      email: f[F.EMAIL] || "",
      newToITI: f[F.NEW_TO_ITI] || "",
      firstTimeCB: f[F.FIRST_TIME_CB] || "",
      firstTimeExp: f[F.FIRST_TIME_EXP] || "",
    },
    app: {
      turnover: f[F.TURNOVER] || "",
      employees: f[F.EMPLOYEES] || "",
      tradedPct: f[F.TRADED_PCT] || "",
      crossBorderPct: f[F.CB_PCT] || "",
      priorITI: f[F.PRIOR_ITI] || "",
      crossBorderTarget: f[F.CB_TARGET_TEXT] || "",
    },
    diagnosis: {
      problem: f[F.PROBLEM] || "",
      problemStatement: f[F.PROBLEM] || "", // alias for new tracker
      observation: f[F.OBSERVATION] || "",
      goal1: f[F.GOAL1] || "",
      goal2: f[F.GOAL2] || "",
      goal3: f[F.GOAL3] || "",
      priorities: f[F.PRIORITIES] || "",
      scenario: f[F.SCENARIO] || "",
      constraints: [
        f[F.CONSTRAINT_1] || "",
        f[F.CONSTRAINT_2] || "",
        f[F.CONSTRAINT_3] || "",
      ],
    },
    crossBorder: {
      baseline: f[F.CB_BASELINE] || "",
      target: f[F.CB_TARGET] || "",
      endline: f[F.CB_ENDLINE] || "",
      baselinePct: f[F.CB_BASELINE] || "",
      endlinePct: f[F.CB_ENDLINE] || "",
    },
    financial: {
      blTurnover: f[F.BL_TURNOVER] || "",
      blTradedIncome: f[F.BL_TRADED_INCOME] || "",
      blTradedPct: f[F.BL_TRADED_PCT] || "",
      blOpSurplus: f[F.BL_OP_SURPLUS] || "",
      blCashPosition: f[F.BL_CASH_POSITION] || "",
      blRunway: f[F.BL_RUNWAY] || "",
      blCbSalesPct: f[F.BL_CB_SALES_PCT] || "",
      blCbSalesVal: f[F.BL_CB_SALES_VAL] || "",
      blExportStatus: f[F.BL_EXPORT_STATUS] || "",
      curTurnover: f[F.CUR_TURNOVER] || "",
      curTradedIncome: f[F.CUR_TRADED_INCOME] || "",
      curTradedPct: f[F.CUR_TRADED_PCT] || "",
      curOpSurplus: f[F.CUR_OP_SURPLUS] || "",
      curCbSalesPct: f[F.CUR_CB_SALES_PCT] || "",
      curCbSalesVal: f[F.CUR_CB_SALES_VAL] || "",
      curAsOf: f[F.CUR_AS_OF] || "",
      lciBaseline: f[F.LCI_BASELINE] || "",
      lciMidpoint: f[F.LCI_MIDPOINT] || "",
      lciEndline: f[F.LCI_ENDLINE] || "",
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
      hours: r.fields[F.CO_DAYS] || "",
      domainMovement: r.fields[F.CO_MOVEMENT] || "",
      domainMovementNA: !!r.fields[F.CO_DOMAIN_NA],
      rag: r.fields[F.CO_RAG] || "",
      ragRationale: r.fields[F.CO_RATIONALE] || "",
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
      actionAgreed: r.fields[F.CC_ACTION] || "",
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
    attendance: attendanceRows.map((r) => ({
      code: r.fields[F.AT_CODE] || "",
      title: r.fields[F.AT_TITLE] || "",
      date: r.fields[F.AT_DATE] || "",
      phase: r.fields[F.AT_PHASE] || "",
      attended: !!r.fields[F.AT_ATTENDED],
      apology: !!r.fields[F.AT_APOLOGY],
      format: r.fields[F.AT_FORMAT] || "",
      notes: r.fields[F.AT_NOTES] || "",
      _rid: r.id,
    })),
    baselineLocked: !!f[F.BASELINE_LOCKED],
  };
}

async function loadAll() {
  const [profiles, baseline, endline, smart, notes, consulting, coaching, checklist, validation, attendance] = await Promise.all([
    listAllRecords(TABLES.ORG_PROFILE),
    listAllRecords(TABLES.BASELINE_SCORES),
    listAllRecords(TABLES.ENDLINE_SCORES),
    listAllRecords(TABLES.SMART),
    listAllRecords(TABLES.NOTES),
    listAllRecords(TABLES.CONSULTING),
    listAllRecords(TABLES.COACHING),
    listAllRecords(TABLES.CHECKLIST),
    listAllRecords(TABLES.VALIDATION),
    listAllRecords(TABLES.ATTENDANCE),
  ]);
  return { profiles, baseline, endline, smart, notes, consulting, coaching, checklist, validation, attendance };
}

async function handleList() {
  const all = await loadAll();
  const orgs = all.profiles.map((p) => buildOrgFromAirtable(p, all.baseline, all.endline, all.smart, all.notes, all.consulting, all.coaching, all.checklist, all.validation, all.attendance));
  return jsonResponse(200, { orgs });
}

async function handleGet(orgCode) {
  const all = await loadAll();
  const profile = all.profiles.find((p) => p.fields[F.ORG_CODE] === orgCode);
  if (!profile) return jsonResponse(404, { error: "Org not found" });
  const org = buildOrgFromAirtable(profile, all.baseline, all.endline, all.smart, all.notes, all.consulting, all.coaching, all.checklist, all.validation, all.attendance);
  return jsonResponse(200, { org });
}

async function seedConsultingAndCoaching(orgCode) {
  // IDEMPOTENT: only create rows that don't already exist for this org/cycle code.
  // Without this guard, every call adds 8 consulting + 5 coaching duplicates.

  // CONSULTING — find existing rows for this org, only seed missing cycles
  const existingConsulting = await listAllRecords(TABLES.CONSULTING);
  const existingConsultingCodes = new Set(
    existingConsulting
      .filter((r) => r.fields[F.CO_ORG] === orgCode)
      .map((r) => r.fields[F.CO_CODE])
      .filter(Boolean)
  );
  const consulting = CONSULTING_TEMPLATE
    .filter((c) => !existingConsultingCodes.has(c.code))
    .map((c) => ({
      fields: scrubFields({
        [F.CO_ORG]: orgCode,
        [F.CO_CODE]: c.code,
        [F.CO_TITLE]: c.title,
        [F.CO_DATE]: c.date,
        [F.CO_PHASE]: c.phase,
        [F.CO_FOCUS]: c.focus,
      }),
    }));
  if (consulting.length === 0) {
    console.log(`[SELECT API] seedConsultingAndCoaching: all consulting cycles already exist for ${orgCode}, skipping.`);
  }
  for (let i = 0; i < consulting.length; i += 10) {
    await airtableFetch(TABLES.CONSULTING, { method: "POST", body: JSON.stringify({ records: consulting.slice(i, i + 10) }) });
  }

  // COACHING — same idempotent check
  const existingCoaching = await listAllRecords(TABLES.COACHING);
  const existingCoachingCodes = new Set(
    existingCoaching
      .filter((r) => r.fields[F.CC_ORG] === orgCode)
      .map((r) => r.fields[F.CC_CODE])
      .filter(Boolean)
  );
  const coaching = COACHING_TEMPLATE
    .filter((c) => !existingCoachingCodes.has(c.code))
    .map((c) => ({
      fields: scrubFields({
        [F.CC_ORG]: orgCode,
        [F.CC_CODE]: c.code,
        [F.CC_TITLE]: c.title,
        [F.CC_DATE]: c.date,
        [F.CC_COACH]: c.coach,
        [F.CC_THEME]: c.theme,
      }),
    }));
  if (coaching.length === 0) {
    console.log(`[SELECT API] seedConsultingAndCoaching: all coaching cycles already exist for ${orgCode}, skipping.`);
  }
  for (let i = 0; i < coaching.length; i += 10) {
    await airtableFetch(TABLES.COACHING, { method: "POST", body: JSON.stringify({ records: coaching.slice(i, i + 10) }) });
  }
}

async function handleCreate(payload) {
  const { name, ceo, code, jurisdiction } = payload;
  if (!name || !ceo || !code) return jsonResponse(400, { error: "name, ceo, code are required" });

  // IDEMPOTENT: check if profile with this code already exists.
  // If yes, do NOT create a duplicate — return success with existing record.
  // This prevents duplicate OrgProfile rows when client retries with no _rid.
  const existing = await listAllRecords(TABLES.ORG_PROFILE);
  const dupe = existing.find((p) => p.fields[F.ORG_CODE] === code);
  if (dupe) {
    console.warn(`[SELECT API] handleCreate: profile already exists for code "${code}" (id=${dupe.id}). Returning existing record instead of creating duplicate.`);
    // Still ensure consulting/coaching are seeded (idempotent on its own side)
    try {
      await seedConsultingAndCoaching(code);
    } catch (err) {
      console.error("[SELECT API] Seed error on existing profile:", err);
    }
    return jsonResponse(200, { ok: true, code, existing: true, id: dupe.id });
  }

  const fields = scrubFields({
    [F.ORG_CODE]: code,
    [F.ORG_NAME]: name,
    [F.CEO_NAME]: ceo,
    [F.JURISDICTION]: jurisdiction || "ROI",
  });
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

// Scrub empty-string values from a fields object before sending to Airtable.
// Airtable rejects "" on Single Select / Multi Select / Date / Email fields with
// INVALID_MULTIPLE_CHOICE_OPTIONS. Setting null clears the field; deleting
// the key entirely leaves the existing value. We delete by default for safety
// (so we never accidentally clear data the user didn't mean to clear).
function scrubFields(fields) {
  if (!fields || typeof fields !== "object") return fields;
  const out = {};
  Object.keys(fields).forEach((k) => {
    const v = fields[k];
    if (v === "") return; // skip empty strings entirely
    if (v === undefined) return;
    if (typeof v === "string" && v.trim() === "") return; // also skip whitespace-only
    out[k] = v;
  });
  return out;
}

async function patchProfile(profileId, fields) {
  const clean = scrubFields(fields);
  if (!Object.keys(clean).length) return;
  await airtableFetch(TABLES.ORG_PROFILE, { method: "PATCH", body: JSON.stringify({ records: [{ id: profileId, fields: clean }] }) });
}

// ── FIX: dedupe by record id before sending. Airtable rejects same id
// twice in one PATCH with INVALID_RECORDS / "You cannot update the same
// record multiple times in a single request."
async function batchUpdate(tableId, updates) {
  const seen = new Set();
  const deduped = [];
  for (const u of updates) {
    if (!u || !u.id) continue;
    if (seen.has(u.id)) {
      console.warn(`[SELECT API] batchUpdate: dropped duplicate update for ${tableId}/${u.id}`);
      continue;
    }
    seen.add(u.id);
    deduped.push(u);
  }
  const clean = deduped.map((u) => ({ id: u.id, fields: scrubFields(u.fields) }));
  for (let i = 0; i < clean.length; i += 10) {
    await airtableFetch(tableId, { method: "PATCH", body: JSON.stringify({ records: clean.slice(i, i + 10) }) });
  }
}

async function batchCreate(tableId, creates) {
  const clean = creates.map((c) => ({ fields: scrubFields(c.fields) }));
  for (let i = 0; i < clean.length; i += 10) {
    await airtableFetch(tableId, { method: "POST", body: JSON.stringify({ records: clean.slice(i, i + 10) }) });
  }
}

async function batchDelete(tableId, ids) {
  // Dedupe ids defensively
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  for (let i = 0; i < uniqueIds.length; i += 10) {
    const batch = uniqueIds.slice(i, i + 10);
    const qs = batch.map((id) => `records[]=${id}`).join("&");
    await airtableFetch(`${tableId}?${qs}`, { method: "DELETE" });
  }
}

async function handleUpdate(payload) {
  const { code, kpi, app, diagnosis, crossBorder, financial, baseline, endline, smart, progress, notes, consulting, coaching, attendance, baselineLocked, intensity, assessor, baselineNotes, baselineReportUrl } = payload;
  if (!code) return jsonResponse(400, { error: "code is required" });

  const profiles = await listAllRecords(TABLES.ORG_PROFILE);
  const profile = profiles.find((p) => p.fields[F.ORG_CODE] === code);
  if (!profile) return jsonResponse(404, { error: "Org not found" });

  // ── PROFILE FIELDS (single record on ORG_PROFILE) ──
  const profileFields = {};

  // Existing KPI fields + new KPI fields
  if (kpi) {
    if (kpi.jurisdiction !== undefined) {
      const v = selectVal(kpi.jurisdiction);
      if (v !== undefined) profileFields[F.JURISDICTION] = v;
    }
    if (kpi.sector !== undefined) profileFields[F.SECTOR] = kpi.sector;
    if (kpi.email !== undefined) {
      const e = String(kpi.email || "").trim();
      if (e === "") profileFields[F.EMAIL] = null;
      else profileFields[F.EMAIL] = e;
    }
    if (kpi.newToITI !== undefined) {
      const v = selectVal(kpi.newToITI);
      if (v !== undefined) profileFields[F.NEW_TO_ITI] = v;
    }
    if (kpi.firstTimeCB !== undefined) {
      const v = selectVal(kpi.firstTimeCB);
      if (v !== undefined) profileFields[F.FIRST_TIME_CB] = v;
    }
    if (kpi.firstTimeExp !== undefined) {
      const v = selectVal(kpi.firstTimeExp);
      if (v !== undefined) profileFields[F.FIRST_TIME_EXP] = v;
    }
    // Legacy fields if old client still sends them:
    if (kpi.crossBorderPct !== undefined) profileFields[F.CB_PCT] = pct(kpi.crossBorderPct);
    if (kpi.turnoverBand !== undefined) profileFields[F.TURNOVER] = String(kpi.turnoverBand);
    if (kpi.employees !== undefined) profileFields[F.EMPLOYEES] = String(kpi.employees);
    if (kpi.tradedPct !== undefined) profileFields[F.TRADED_PCT] = pct(kpi.tradedPct);
  }

  // Application-stage data (new — was previously dropped)
  if (app) {
    if (app.turnover !== undefined) profileFields[F.TURNOVER] = String(app.turnover || "");
    if (app.employees !== undefined) profileFields[F.EMPLOYEES] = String(app.employees || "");
    if (app.tradedPct !== undefined) profileFields[F.TRADED_PCT] = pct(app.tradedPct);
    if (app.crossBorderPct !== undefined) profileFields[F.CB_PCT] = pct(app.crossBorderPct);
    if (app.priorITI !== undefined) {
      const v = selectVal(app.priorITI);
      if (v !== undefined) profileFields[F.PRIOR_ITI] = v;
    }
    if (app.crossBorderTarget !== undefined) profileFields[F.CB_TARGET_TEXT] = app.crossBorderTarget;
  }

  // Diagnosis (existing + new scenario/constraints)
  if (diagnosis) {
    // Accept either problemStatement (new) or problem (old) — normalise to PROBLEM field
    if (diagnosis.problemStatement !== undefined) profileFields[F.PROBLEM] = diagnosis.problemStatement;
    else if (diagnosis.problem !== undefined) profileFields[F.PROBLEM] = diagnosis.problem;
    if (diagnosis.observation !== undefined) profileFields[F.OBSERVATION] = diagnosis.observation;
    if (diagnosis.goal1 !== undefined) profileFields[F.GOAL1] = diagnosis.goal1;
    if (diagnosis.goal2 !== undefined) profileFields[F.GOAL2] = diagnosis.goal2;
    if (diagnosis.goal3 !== undefined) profileFields[F.GOAL3] = diagnosis.goal3;
    if (diagnosis.priorities !== undefined) {
      // Accept array (join) or string
      profileFields[F.PRIORITIES] = Array.isArray(diagnosis.priorities)
        ? diagnosis.priorities.join(", ")
        : String(diagnosis.priorities);
    }
    if (diagnosis.scenario !== undefined) {
      const v = selectVal(diagnosis.scenario);
      if (v !== undefined) profileFields[F.SCENARIO] = v;
    }
    if (Array.isArray(diagnosis.constraints)) {
      if (diagnosis.constraints[0] !== undefined) profileFields[F.CONSTRAINT_1] = diagnosis.constraints[0] || "";
      if (diagnosis.constraints[1] !== undefined) profileFields[F.CONSTRAINT_2] = diagnosis.constraints[1] || "";
      if (diagnosis.constraints[2] !== undefined) profileFields[F.CONSTRAINT_3] = diagnosis.constraints[2] || "";
    }
  }

  // Cross-border baseline/target/endline (existing structured fields)
  if (crossBorder) {
    if (crossBorder.baseline !== undefined) profileFields[F.CB_BASELINE] = crossBorder.baseline;
    if (crossBorder.target !== undefined) profileFields[F.CB_TARGET] = crossBorder.target;
    if (crossBorder.endline !== undefined) profileFields[F.CB_ENDLINE] = crossBorder.endline;
    // Aliases used by new tracker
    if (crossBorder.baselinePct !== undefined) profileFields[F.CB_BASELINE] = crossBorder.baselinePct;
    if (crossBorder.endlinePct !== undefined) profileFields[F.CB_ENDLINE] = crossBorder.endlinePct;
  }

  // Financial baseline + current + LCI (new — was previously dropped)
  if (financial) {
    if (financial.blTurnover !== undefined) profileFields[F.BL_TURNOVER] = String(financial.blTurnover || "");
    if (financial.blTradedIncome !== undefined) profileFields[F.BL_TRADED_INCOME] = String(financial.blTradedIncome || "");
    if (financial.blTradedPct !== undefined) profileFields[F.BL_TRADED_PCT] = String(financial.blTradedPct || "");
    if (financial.blOpSurplus !== undefined) profileFields[F.BL_OP_SURPLUS] = String(financial.blOpSurplus || "");
    if (financial.blCashPosition !== undefined) profileFields[F.BL_CASH_POSITION] = String(financial.blCashPosition || "");
    if (financial.blRunway !== undefined) profileFields[F.BL_RUNWAY] = String(financial.blRunway || "");
    if (financial.blCbSalesPct !== undefined) profileFields[F.BL_CB_SALES_PCT] = String(financial.blCbSalesPct || "");
    if (financial.blCbSalesVal !== undefined) profileFields[F.BL_CB_SALES_VAL] = String(financial.blCbSalesVal || "");
    if (financial.blExportStatus !== undefined) {
      const v = selectVal(financial.blExportStatus);
      if (v !== undefined) profileFields[F.BL_EXPORT_STATUS] = v;
    }
    if (financial.curTurnover !== undefined) profileFields[F.CUR_TURNOVER] = String(financial.curTurnover || "");
    if (financial.curTradedIncome !== undefined) profileFields[F.CUR_TRADED_INCOME] = String(financial.curTradedIncome || "");
    if (financial.curTradedPct !== undefined) profileFields[F.CUR_TRADED_PCT] = String(financial.curTradedPct || "");
    if (financial.curOpSurplus !== undefined) profileFields[F.CUR_OP_SURPLUS] = String(financial.curOpSurplus || "");
    if (financial.curCbSalesPct !== undefined) profileFields[F.CUR_CB_SALES_PCT] = String(financial.curCbSalesPct || "");
    if (financial.curCbSalesVal !== undefined) profileFields[F.CUR_CB_SALES_VAL] = String(financial.curCbSalesVal || "");
    if (financial.curAsOf !== undefined) profileFields[F.CUR_AS_OF] = financial.curAsOf || "";
    if (financial.lciBaseline !== undefined) profileFields[F.LCI_BASELINE] = String(financial.lciBaseline || "");
    if (financial.lciMidpoint !== undefined) profileFields[F.LCI_MIDPOINT] = String(financial.lciMidpoint || "");
    if (financial.lciEndline !== undefined) profileFields[F.LCI_ENDLINE] = String(financial.lciEndline || "");
  }

  if (intensity !== undefined) profileFields[F.INTENSITY] = intensity;
  if (baselineLocked !== undefined) profileFields[F.BASELINE_LOCKED] = !!baselineLocked;
  if (baselineNotes !== undefined) profileFields[F.BASELINE_NOTES] = String(baselineNotes || "");
  if (baselineReportUrl !== undefined) profileFields[F.BASELINE_REPORT_URL] = String(baselineReportUrl || "");

  // Assessor: NEW supports rich object {assessor (lead name), checklist, validation, goals, priorities, lock}
  // OR legacy plain string. Detect and handle both.
  let assessorObj = null;
  if (assessor !== undefined) {
    if (typeof assessor === "string") {
      profileFields[F.ASSESSOR] = assessor;
    } else if (assessor && typeof assessor === "object") {
      assessorObj = assessor;
      if (assessor.assessor !== undefined) profileFields[F.ASSESSOR] = String(assessor.assessor || "");
      // Goals (rich form fields override legacy diagnosis.* if present)
      if (assessor.goals && typeof assessor.goals === "object") {
        if (assessor.goals.g_problem !== undefined) profileFields[F.PROBLEM] = assessor.goals.g_problem;
        if (assessor.goals.g_goal1 !== undefined) profileFields[F.GOAL1] = assessor.goals.g_goal1;
        if (assessor.goals.g_goal2 !== undefined) profileFields[F.GOAL2] = assessor.goals.g_goal2;
        if (assessor.goals.g_goal3 !== undefined) profileFields[F.GOAL3] = assessor.goals.g_goal3;
      }
      if (Array.isArray(assessor.priorities)) {
        profileFields[F.PRIORITIES] = assessor.priorities.join(", ");
      } else if (typeof assessor.priorities === "string") {
        profileFields[F.PRIORITIES] = assessor.priorities;
      }
      // Lock fields
      if (assessor.lock && typeof assessor.lock === "object") {
        if (assessor.lock.lk1 !== undefined) profileFields[F.LOCK_LK1] = !!assessor.lock.lk1;
        if (assessor.lock.lk2 !== undefined) profileFields[F.LOCK_LK2] = !!assessor.lock.lk2;
        if (assessor.lock.lk3 !== undefined) profileFields[F.LOCK_LK3] = !!assessor.lock.lk3;
        if (assessor.lock.lk4 !== undefined) profileFields[F.LOCK_LK4] = !!assessor.lock.lk4;
        if (assessor.lock.lk_led !== undefined) {
          const v = selectVal(assessor.lock.lk_led);
          if (v !== undefined) profileFields[F.LOCK_LED] = v;
        }
        if (assessor.lock.lk_session_date !== undefined) {
          const d = String(assessor.lock.lk_session_date || "").trim();
          profileFields[F.LOCK_SESSION_DATE] = d === "" ? null : d;
        }
        if (assessor.lock.lk_lock_date !== undefined) {
          const d = String(assessor.lock.lk_lock_date || "").trim();
          profileFields[F.LOCK_LOCK_DATE] = d === "" ? null : d;
        }
      }
    }
  }

  await patchProfile(profile.id, profileFields);

  // ── BASELINE SCORES table ──
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

  // ── ENDLINE SCORES table ──
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

  // ── SMART table ──
  if (Array.isArray(smart)) {
    const existing = await listAllRecords(TABLES.SMART);
    const toDelete = existing.filter((r) => r.fields[F.SM_ORG] === code).map((r) => r.id);
    await batchDelete(TABLES.SMART, toDelete);
    const creates = smart.map((s, i) => {
      const fields = {
        [F.SM_ORG]: code,
        [F.SM_NUM]: i + 1,
        [F.SM_OBJ]: s.objective || "",
        [F.SM_TARGET]: s.target || "",
        [F.SM_TIMELINE]: s.timeline || "",
      };
      // Owner / status may be select fields — skip if empty
      const owner = selectVal(s.owner);
      if (owner !== undefined) fields[F.SM_OWNER] = owner;
      const status = selectVal(s.status);
      if (status !== undefined) fields[F.SM_STATUS] = status;
      return { fields };
    });
    await batchCreate(TABLES.SMART, creates);
  }

  // ── CONSULTING table ──
  if (Array.isArray(consulting)) {
    const existing = await listAllRecords(TABLES.CONSULTING);
    const byCode = {};
    existing.filter((r) => r.fields[F.CO_ORG] === code).forEach((r) => (byCode[r.fields[F.CO_CODE]] = r));
    const updates = [];
    const creates = [];
    const seenCodes = new Set();
    consulting.forEach((c) => {
      // Dedupe incoming payload by session code — guard against client cache
      // having shipped two rows for the same cycle (the original cause of the bug).
      if (!c.code) return;
      if (seenCodes.has(c.code)) {
        console.warn(`[SELECT API] handleUpdate: dropped duplicate incoming consulting row ${code}/${c.code}`);
        return;
      }
      seenCodes.add(c.code);

      const fields = {
        [F.CO_ORG]: code,
        [F.CO_CODE]: c.code || "",
        [F.CO_TITLE]: c.title || "",
        [F.CO_DATE]: c.date || "",
        [F.CO_FOCUS]: c.focus || "",
        [F.CO_SMART]: c.smartProgressed || "",
        [F.CO_ACTIONS]: c.actionsAgreed || "",
        [F.CO_OUTPUTS]: c.keyOutputs || "",
        [F.CO_DAYS]: (c.hours !== undefined && c.hours !== "") ? c.hours : (c.days || ""),
        [F.CO_MOVEMENT]: c.domainMovement || "",
        [F.CO_DOMAIN_NA]: !!c.domainMovementNA,
        [F.CO_RATIONALE]: c.ragRationale || "",
        [F.CO_DONE]: !!c.completed,
      };
      // Select fields: only set if non-empty (else Airtable rejects with INVALID_MULTIPLE_CHOICE_OPTIONS)
      const phase = selectVal(c.phase);
      if (phase !== undefined) fields[F.CO_PHASE] = phase;
      const by = selectVal(c.consultedBy);
      if (by !== undefined) fields[F.CO_BY] = by;
      const fmt = selectVal(c.format);
      if (fmt !== undefined) fields[F.CO_FORMAT] = fmt;
      const rag = selectVal(c.rag);
      if (rag !== undefined) fields[F.CO_RAG] = rag;

      const exists = byCode[c.code];
      if (exists) updates.push({ id: exists.id, fields });
      else creates.push({ fields });
    });
    await batchUpdate(TABLES.CONSULTING, updates);
    await batchCreate(TABLES.CONSULTING, creates);
  }

  // ── COACHING table ──
  if (Array.isArray(coaching)) {
    const existing = await listAllRecords(TABLES.COACHING);
    const byCode = {};
    existing.filter((r) => r.fields[F.CC_ORG] === code).forEach((r) => (byCode[r.fields[F.CC_CODE]] = r));
    const updates = [];
    const creates = [];
    const seenCodes = new Set();
    coaching.forEach((c) => {
      if (!c.code) return;
      if (seenCodes.has(c.code)) {
        console.warn(`[SELECT API] handleUpdate: dropped duplicate incoming coaching row ${code}/${c.code}`);
        return;
      }
      seenCodes.add(c.code);

      const fields = {
        [F.CC_ORG]: code,
        [F.CC_CODE]: c.code || "",
        [F.CC_TITLE]: c.title || "",
        [F.CC_DATE]: c.date || "",
        [F.CC_HOURS]: c.hours || "",
        [F.CC_THEME]: c.theme || "",
        [F.CC_ACTION]: c.action || c.actionAgreed || "",
        [F.CC_DONE]: !!c.completed,
      };
      // Coach is a select field — only set if non-empty
      const coach = selectVal(c.coach);
      if (coach !== undefined) fields[F.CC_COACH] = coach;

      const exists = byCode[c.code];
      if (exists) updates.push({ id: exists.id, fields });
      else creates.push({ fields });
    });
    await batchUpdate(TABLES.COACHING, updates);
    await batchCreate(TABLES.COACHING, creates);
  }

  // ── CHECKLIST table (12 SOP items, indexed 0–11; from assessor.checklist) ──
  if (assessorObj && assessorObj.checklist && typeof assessorObj.checklist === "object") {
    const existing = await listAllRecords(TABLES.CHECKLIST);
    const byIdx = {};
    existing.filter((r) => r.fields[F.CK_ORG] === code).forEach((r) => (byIdx[r.fields[F.CK_INDEX]] = r));
    const updates = [];
    const creates = [];
    // Iterate ck0..ck11 keys
    for (let i = 0; i < 12; i++) {
      const key = "ck" + i;
      if (assessorObj.checklist[key] === undefined) continue;
      const done = !!assessorObj.checklist[key];
      const ts = String(assessorObj.checklist[key + "_ts"] || "").trim();
      const fields = {
        [F.CK_ORG]: code,
        [F.CK_INDEX]: i,
        [F.CK_DONE]: done,
      };
      if (ts) fields[F.CK_AT] = ts;
      const exists = byIdx[i];
      if (exists) updates.push({ id: exists.id, fields });
      else creates.push({ fields });
    }
    await batchUpdate(TABLES.CHECKLIST, updates);
    await batchCreate(TABLES.CHECKLIST, creates);
  }

  // ── VALIDATION table (vn1..vn5 notes, from assessor.validation) ──
  if (assessorObj && assessorObj.validation && typeof assessorObj.validation === "object") {
    const existing = await listAllRecords(TABLES.VALIDATION);
    const byNum = {};
    existing.filter((r) => r.fields[F.V_ORG] === code).forEach((r) => (byNum[r.fields[F.V_NUM]] = r));
    const updates = [];
    const creates = [];
    for (let n = 1; n <= 5; n++) {
      const key = "vn" + n;
      if (assessorObj.validation[key] === undefined) continue;
      const fields = {
        [F.V_ORG]: code,
        [F.V_NUM]: n,
        [F.V_NOTES]: assessorObj.validation[key] || "",
      };
      const exists = byNum[n];
      if (exists) updates.push({ id: exists.id, fields });
      else creates.push({ fields });
    }
    await batchUpdate(TABLES.VALIDATION, updates);
    await batchCreate(TABLES.VALIDATION, creates);
  }

  // ── ATTENDANCE table ──
  if (Array.isArray(attendance)) {
    const existing = await listAllRecords(TABLES.ATTENDANCE);
    const byCode = {};
    existing.filter((r) => r.fields[F.AT_ORG] === code).forEach((r) => (byCode[r.fields[F.AT_CODE]] = r));
    const updates = [];
    const creates = [];
    const seenCodes = new Set();
    attendance.forEach((a) => {
      const sessionCode = a.code || "";
      if (!sessionCode) return;
      if (seenCodes.has(sessionCode)) {
        console.warn(`[SELECT API] handleUpdate: dropped duplicate incoming attendance row ${code}/${sessionCode}`);
        return;
      }
      seenCodes.add(sessionCode);

      const fields = {
        [F.AT_ORG]: code,
        [F.AT_CODE]: sessionCode,
        [F.AT_TITLE]: a.title || "",
        [F.AT_DATE]: a.date || "",
        [F.AT_PHASE]: a.phase || "",
        [F.AT_ATTENDED]: !!a.attended,
        [F.AT_APOLOGY]: !!a.apology,
        [F.AT_NOTES]: a.notes || "",
      };
      // Format is Single select — skip if empty
      const fmt = selectVal(a.format);
      if (fmt !== undefined) fields[F.AT_FORMAT] = fmt;

      const exists = byCode[sessionCode];
      if (exists) updates.push({ id: exists.id, fields });
      else creates.push({ fields });
    });
    await batchUpdate(TABLES.ATTENDANCE, updates);
    await batchCreate(TABLES.ATTENDANCE, creates);
  }

  // ── NOTES table (progress + general notes) ──
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

// ── Score how "filled in" a record is, so dedupe can keep the better row ──
function recordRichness(record, fieldIds) {
  let score = 0;
  if (!record || !record.fields) return 0;
  for (const fid of fieldIds) {
    const v = record.fields[fid];
    if (v === undefined || v === null) continue;
    if (typeof v === "string") {
      if (v.trim() !== "") score += v.trim().length > 30 ? 2 : 1;
    } else if (typeof v === "boolean") {
      if (v) score += 1;
    } else if (typeof v === "number") {
      score += 1;
    } else if (Array.isArray(v)) {
      if (v.length) score += 1;
    } else {
      score += 1;
    }
  }
  return score;
}

// ── Dedupe a single table by (orgField, codeField) ──
async function dedupeTable(tableId, orgField, codeField, allDataFields) {
  const records = await listAllRecords(tableId);
  // Group by orgCode + sessionCode
  const groups = new Map();
  for (const r of records) {
    const orgCode = r.fields[orgField];
    const sessionCode = r.fields[codeField];
    if (!orgCode || !sessionCode) continue;
    const key = `${orgCode}::${sessionCode}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  const idsToDelete = [];
  const groupReports = [];
  for (const [key, rows] of groups) {
    if (rows.length <= 1) continue;
    // Sort by richness desc, then by createdTime asc as tiebreaker (oldest wins on tie)
    rows.sort((a, b) => {
      const sa = recordRichness(a, allDataFields);
      const sb = recordRichness(b, allDataFields);
      if (sb !== sa) return sb - sa;
      // Airtable record IDs are roughly time-ordered; fall back to id compare
      return String(a.id).localeCompare(String(b.id));
    });
    const keep = rows[0];
    const drop = rows.slice(1);
    drop.forEach((r) => idsToDelete.push(r.id));
    groupReports.push({
      key,
      kept: keep.id,
      keptScore: recordRichness(keep, allDataFields),
      deleted: drop.map((r) => ({ id: r.id, score: recordRichness(r, allDataFields) })),
    });
  }

  if (idsToDelete.length) {
    await batchDelete(tableId, idsToDelete);
  }

  return {
    table: tableId,
    duplicateGroups: groupReports.length,
    rowsDeleted: idsToDelete.length,
    details: groupReports,
  };
}

async function handleDedupe() {
  const consultingFields = [F.CO_TITLE, F.CO_DATE, F.CO_PHASE, F.CO_FOCUS, F.CO_BY, F.CO_FORMAT, F.CO_SMART, F.CO_ACTIONS, F.CO_OUTPUTS, F.CO_DAYS, F.CO_MOVEMENT, F.CO_RAG, F.CO_RATIONALE, F.CO_DOMAIN_NA, F.CO_DONE];
  const coachingFields = [F.CC_TITLE, F.CC_DATE, F.CC_COACH, F.CC_HOURS, F.CC_THEME, F.CC_ACTION, F.CC_DONE];
  const attendanceFields = [F.AT_TITLE, F.AT_DATE, F.AT_PHASE, F.AT_ATTENDED, F.AT_APOLOGY, F.AT_FORMAT, F.AT_NOTES];

  const consultingReport = await dedupeTable(TABLES.CONSULTING, F.CO_ORG, F.CO_CODE, consultingFields);
  const coachingReport = await dedupeTable(TABLES.COACHING, F.CC_ORG, F.CC_CODE, coachingFields);
  const attendanceReport = await dedupeTable(TABLES.ATTENDANCE, F.AT_ORG, F.AT_CODE, attendanceFields);

  return jsonResponse(200, {
    ok: true,
    summary: {
      consulting: { duplicateGroups: consultingReport.duplicateGroups, rowsDeleted: consultingReport.rowsDeleted },
      coaching: { duplicateGroups: coachingReport.duplicateGroups, rowsDeleted: coachingReport.rowsDeleted },
      attendance: { duplicateGroups: attendanceReport.duplicateGroups, rowsDeleted: attendanceReport.rowsDeleted },
    },
    detail: {
      consulting: consultingReport,
      coaching: coachingReport,
      attendance: attendanceReport,
    },
  });
}

exports.handler = async (event) => {
  console.log("[SELECT API v4] Invoked - method:", event.httpMethod, "action:", (() => { try { return JSON.parse(event.body || "{}").action; } catch { return "?"; } })());
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: corsHeaders(), body: "" };
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed" });
  if (!process.env.AIRTABLE_PAT || !process.env.AIRTABLE_BASE_ID) return jsonResponse(500, { error: "Server misconfigured — missing env vars" });

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch (e) { return jsonResponse(400, { error: "Invalid JSON" }); }

  const masterPw = process.env.TRACKER_MASTER_PW || "SELECT2026";
  const authHeader = event.headers['x-auth'] || event.headers['X-Auth'] || '';
  const isAssessor = body.password === masterPw || authHeader === masterPw;
  const writeActions = new Set(["create", "update", "remove", "seed", "dedupe"]);
  if (writeActions.has(body.action) && !isAssessor) return jsonResponse(403, { error: "Assessor password required for this action" });

  try {
    switch (body.action) {
      case "list": return await handleList();
      case "get": return await handleGet(body.code);
      case "create": return await handleCreate(body);
      case "update": return await handleUpdate(body);
      case "remove": return await handleRemove(body.code);
      case "dedupe": return await handleDedupe();
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
