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
      target: r.fields[F.SM_TARGET] || "",
      timeline: r.fields[F.SM_TIMELINE] || "",
      owner: r.fields[F.SM_OWNER] || "",
      _rid: r.id,
      _num: r.fields[F.SM_NUM] || i + 1,
    })),
    progress: progressItems,
    notes: generalNotes,
    baselineLocked: !!f[F.BASELINE_LOCKED],
  };
}

async function handleList() {
  const [profiles, baseline, endline, smart, notes] = await Promise.all([
    listAllRecords(TABLES.ORG_PROFILE),
    listAllRecords(TABLES.BASELINE_SCORES),
    listAllRecords(TABLES.ENDLINE_SCORES),
    listAllRecords(TABLES.SMART),
    listAllRecords(TABLES.NOTES),
  ]);
  const orgs = profiles.map((p) => buildOrgFromAirtable(p, baseline, endline, smart, notes));
  return jsonResponse(200, { orgs });
}

async function handleGet(orgCode) {
  const [profiles, baseline, endline, smart, notes] = await Promise.all([
    listAllRecords(TABLES.ORG_PROFILE),
    listAllRecords(TABLES.BASELINE_SCORES),
    listAllRecords(TABLES.ENDLINE_SCORES),
    listAllRecords(TABLES.SMART),
    listAllRecords(TABLES.NOTES),
  ]);
  const profile = profiles.find((p) => p.fields[F.ORG_CODE] === orgCode);
  if (!profile) return jsonResponse(404, { error: "Org not found" });
  const org = buildOrgFromAirtable(profile, baseline, endline, smart, notes);
  return jsonResponse(200, { org });
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
  await airtableFetch(TABLES.ORG_PROFILE, {
    method: "POST",
    body: JSON.stringify({ records: [{ fields }] }),
  });
  return jsonResponse(200, { ok: true, code });
}

async function handleRemove(orgCode) {
  const profiles = await listAllRecords(TABLES.ORG_PROFILE);
  const target = profiles.find((p) => p.fields[F.ORG_CODE] === orgCode);
  if (!target) return jsonResponse(404, { error: "Org not found" });
  await airtableFetch(`${TABLES.ORG_PROFILE}/${target.id}`, { method: "DELETE" });
  return jsonResponse(200, { ok: true });
}

async function handleUpdate(payload) {
  const { code, kpi, baseline, endline, smart, progress, notes, baselineLocked } = payload;
  if (!code) return jsonResponse(400, { error: "code is required" });

  const profiles = await listAllRecords(TABLES.ORG_PROFILE);
  const profile = profiles.find((p) => p.fields[F.ORG_CODE] === code);
  if (!profile) return jsonResponse(404, { error: "Org not found" });

  const profileFields = {};
  if (kpi) {
    if (kpi.jurisdiction !== undefined) profileFields[F.JURISDICTION] = kpi.jurisdiction;
    if (kpi.crossBorderPct !== undefined) profileFields[F.CB_PCT] = pct(kpi.crossBorderPct);
    if (kpi.turnoverBand !== undefined) profileFields[F.TURNOVER] = String(kpi.turnoverBand);
  }
  if (baselineLocked !== undefined) profileFields[F.BASELINE_LOCKED] = !!baselineLocked;
  if (Object.keys(profileFields).length) {
    await airtableFetch(TABLES.ORG_PROFILE, {
      method: "PATCH",
      body: JSON.stringify({ records: [{ id: profile.id, fields: profileFields }] }),
    });
  }

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
      const exists = byNum[num];
      if (exists) ops.push({ id: exists.id, fields });
      else if (score !== null) ops.push({ fields });
    });
    const updates = ops.filter((o) => o.id);
    const creates = ops.filter((o) => !o.id);
    if (updates.length) {
      for (let i = 0; i < updates.length; i += 10) {
        await airtableFetch(TABLES.BASELINE_SCORES, {
          method: "PATCH",
          body: JSON.stringify({ records: updates.slice(i, i + 10) }),
        });
      }
    }
    if (creates.length) {
      for (let i = 0; i < creates.length; i += 10) {
        await airtableFetch(TABLES.BASELINE_SCORES, {
          method: "POST",
          body: JSON.stringify({ records: creates.slice(i, i + 10) }),
        });
      }
    }
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
    const updates = ops.filter((o) => o.id);
    const creates = ops.filter((o) => !o.id);
    if (updates.length) {
      for (let i = 0; i < updates.length; i += 10) {
        await airtableFetch(TABLES.ENDLINE_SCORES, {
          method: "PATCH",
          body: JSON.stringify({ records: updates.slice(i, i + 10) }),
        });
      }
    }
    if (creates.length) {
      for (let i = 0; i < creates.length; i += 10) {
        await airtableFetch(TABLES.ENDLINE_SCORES, {
          method: "POST",
          body: JSON.stringify({ records: creates.slice(i, i + 10) }),
        });
      }
    }
  }

  if (Array.isArray(smart)) {
    const existing = await listAllRecords(TABLES.SMART);
    const toDelete = existing.filter((r) => r.fields[F.SM_ORG] === code).map((r) => r.id);
    for (let i = 0; i < toDelete.length; i += 10) {
      const batch = toDelete.slice(i, i + 10);
      const qs = batch.map((id) => `records[]=${id}`).join("&");
      await airtableFetch(`${TABLES.SMART}?${qs}`, { method: "DELETE" });
    }
    const creates = smart.map((s, i) => ({
      fields: {
        [F.SM_ORG]: code,
        [F.SM_NUM]: i + 1,
        [F.SM_OBJ]: s.objective || "",
        [F.SM_TARGET]: s.target || "",
        [F.SM_TIMELINE]: s.timeline || "",
        [F.SM_OWNER]: s.owner || "",
      },
    }));
    for (let i = 0; i < creates.length; i += 10) {
      await airtableFetch(TABLES.SMART, {
        method: "POST",
        body: JSON.stringify({ records: creates.slice(i, i + 10) }),
      });
    }
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

    for (let i = 0; i < toDelete.length; i += 10) {
      const batch = toDelete.slice(i, i + 10);
      const qs = batch.map((id) => `records[]=${id}`).join("&");
      await airtableFetch(`${TABLES.NOTES}?${qs}`, { method: "DELETE" });
    }

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
    for (let i = 0; i < creates.length; i += 10) {
      await airtableFetch(TABLES.NOTES, {
        method: "POST",
        body: JSON.stringify({ records: creates.slice(i, i + 10) }),
      });
    }
  }

  return jsonResponse(200, { ok: true });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  if (!process.env.AIRTABLE_PAT || !process.env.AIRTABLE_BASE_ID) {
    return jsonResponse(500, { error: "Server misconfigured — missing env vars" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return jsonResponse(400, { error: "Invalid JSON" });
  }

  const masterPw = process.env.TRACKER_MASTER_PW || "SELECT2026";
  const isAssessor = body.password === masterPw;
  const writeActions = new Set(["create", "update", "remove"]);
  if (writeActions.has(body.action) && !isAssessor) {
    return jsonResponse(403, { error: "Assessor password required for this action" });
  }

  try {
    switch (body.action) {
      case "list": return await handleList();
      case "get": return await handleGet(body.code);
      case "create": return await handleCreate(body);
      case "update": return await handleUpdate(body);
      case "remove": return await handleRemove(body.code);
      default: return jsonResponse(400, { error: `Unknown action: ${body.action}` });
    }
  } catch (err) {
    console.error("[SELECT API] Error:", err);
    return jsonResponse(500, { error: err.message });
  }
};
