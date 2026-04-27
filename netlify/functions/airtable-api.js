const AIRTABLE_API = "https://api.airtable.com/v0";

const TABLES = {
  ORG_PROFILE: "tbllTzw4lqgmyPIc3",
  BASELINE_SCORES: "tblEyUOd2daJ1tMeu",
  ENDLINE_SCORES: "tblo7cpZsebw9TuNV",
  SMART: "tblHePg3WQAfX9vTN",
  NOTES: "tblFICUlttziIutny",
};

const F = {
  ORG_CODE: "fldOBxNIVjIlQwSFZ",
  ORG_NAME: "fldk28wgiUmfeVXcx",
  CEO_NAME: "fldtINk3uMaArAIfa",
  JURISDICTION: "fldq0wb9LMKO4C61r",
  SECTOR: "fldOxUc6wIAMfrGve",
  EMAIL: "fldZQg3ujM822wZQD",
  TURNOVER: "fldOZsxjgWLp4BFme",
  EMPLOYEES: "fldSGnOxSrsw1eqpB",
  TRADED_PCT: "fldxsu8L5LsRFhDqe",
  CB_PCT: "fld2rddFZslhNkD78",
  BASELINE_LOCKED: "fld8UegLqlAhxOQn5",
  PROBLEM: "fldbolARwmijz00Xf",
  BS_ORG: "fldTH4PXtzyyJ35yC",
  BS_DOMAIN_NUM: "fldMM5I9G3i4HFKmL",
  BS_DOMAIN_NAME: "fldIs8JqfiHJ1Emxj",
  BS_SCORE: "fldBOIswEhIHAlpFn",
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
  N_ORG: "fld5R5Xu0w7bsZPPb",
  N_TYPE: "fldBrPnmYAOUGI9qf",
  N_DATE: "fldIqqY9fKfLafcGo",
  N_TEXT: "fldFYEUxCgkotAVTg",
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

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
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
  if (!res.ok) {
    throw new Error(`Airtable ${res.status}: ${JSON.stringify(body)}`);
  }
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

function buildOrgFromAirtable(profile, baseline, endline, smart, notes) {
  const f = profile.fields;
  const orgCode = f[F.ORG_CODE] || profile.id;

  const baselineRows = baseline
    .filter((r) => r.fields[F.BS_ORG] === orgCode)
    .sort((a, b) => (a.fields[F.BS_DOMAIN_NUM] || 0) - (b.fields[F.BS_DOMAIN_NUM] || 0));
  const endlineRows = endline
    .filter((r) => r.fields[F.ES_ORG] === orgCode)
    .sort((a, b) => (a.fields[F.ES_DOMAIN_NUM] || 0) - (b.fields[F.ES_DOMAIN_NUM] || 0));
  const smartRows = smart
    .filter((r) => r.fields[F.SM_ORG] === orgCode)
    .sort((a, b) => (a.fields[F.SM_NUM] || 0) - (b.fields[F.SM_NUM] || 0));
  const noteRows = notes.filter((r) => r.fields[F.N_ORG] === orgCode);

  const baselineByNum = {};
  baselineRows.forEach((r) => (baselineByNum[r.fields[F.BS_DOMAIN_NUM]] = r));
  const endlineByNum = {};
  endlineRows.forEach((r) => (endlineByNum[r.fields[F.ES_DOMAIN_NUM]] = r));

  const baselineFull = DOMAINS.map((d, i) => {
    const row = baselineByNum[i + 1];
    return { domain: d, score: row ? row.fields[F.BS_SCORE] ?? "" : "", _rid: row ? row.id : null };
  });
  const endlineFull = DOMAINS.map((d, i) => {
    const row = endlineByNum[i + 1];
    return { domain: d, score: row ? row.fields[F.ES_SCORE] ?? "" : "", _rid: row ? row.id : null };
  });

  const progressItems = noteRows
    .filter((r) => r.fields[F.N_TYPE] === "Progress")
    .map((r) => ({ month: r.fields[F.N_DATE] || "", text: r.fields[F.N_TEXT] || "", _rid: r.id }));
  const generalNotes = noteRows
    .filter((r) => r.fields[F.N_TYPE] === "Consulting" || r.fields[F.N_TYPE] === "Coaching" || r.fields[F.N_TYPE] === "Form Submission")
    .map((r) => ({ type: r.fields[F.N_TYPE], date: r.fields[F.N_DATE] || "", text: r.fields[F.N_TEXT] || "", _rid: r.id }));

  return {
    _rid: profile.id,
    name: f[F.ORG_NAME] || "",
    ceo: f[F.CEO_NAME] || "",
    code: orgCode,
    password: orgCode,
    kpi: {
      jurisdiction: f[F.JURISDICTION] || "",
      newToITI: "",
      firstTimeCB: "",
      firstTimeExp: "",
      crossBorderPct: f[F.CB_PCT] || "",
      turnoverBand: f[F.TURNOVER] || "",
    },
    baseline: baselineFull,
    endline: endlineFull,
    smart: smartRows.map((r, i) => ({
      objective: r.fields[F.SM_OBJ] || "",
      target: r.fields[F.SM_TARGET]
