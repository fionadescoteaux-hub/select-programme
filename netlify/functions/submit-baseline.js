const AIRTABLE_API = "https://api.airtable.com/v0";

const TABLES = {
  ORG_PROFILE: "tbllTzw4lqgmyPIc3",
  NOTES: "tblFICUlttziIutny",
};

const ORG_PROFILE_FIELDS = {
  OrgCode: "fldOBxNIVjIlQwSFZ",
  OrgName: "fldk28wgiUmfeVXcx",
  CEOName: "fldtINk3uMaArAIfa",
  Jurisdiction: "fldq0wb9LMKO4C61r",
  Sector: "fldOxUc6wIAMfrGve",
  Email: "fldZQg3ujM822wZQD",
  Turnover: "fldOZsxjgWLp4BFme",
  Employees: "fldSGnOxSrsw1eqpB",
  TradedPct: "fldxsu8L5LsRFhDqe",
  CrossBorderPct: "fld2rddFZslhNkD78",
  BaselineLocked: "fld8UegLqlAhxOQn5",
};

const NOTES_FIELDS = {
  OrgCode: "fld5R5Xu0w7bsZPPb",
  NoteType: "fldBrPnmYAOUGI9qf",
  Date: "fldIqqY9fKfLafcGo",
  Text: "fldFYEUxCgkotAVTg",
};

function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 60);
}

function pct(value) {
  if (value === undefined || value === null) return "";
  const m = String(value).match(/(\d+(?:\.\d+)?)/);
  return m ? m[1] : "";
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

async function airtableFetch(path, options) {
  const url = `${AIRTABLE_API}/${process.env.AIRTABLE_BASE_ID}/${path}`;
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
    const err = new Error(`Airtable ${res.status}: ${JSON.stringify(body)}`);
    err.status = res.status;
    throw err;
  }
  return body;
}

async function upsertOrgProfile(payload) {
  const orgCode = slugify(payload.organisation || payload.org || "");
  if (!orgCode) throw new Error("Missing organisation name — cannot generate OrgCode");

  const fields = {
    [ORG_PROFILE_FIELDS.OrgCode]: orgCode,
    [ORG_PROFILE_FIELDS.OrgName]: payload.organisation || "",
    [ORG_PROFILE_FIELDS.CEOName]: payload.ceo || "",
  };

  if (payload.email) fields[ORG_PROFILE_FIELDS.Email] = payload.email;
  if (payload.jurisdiction) fields[ORG_PROFILE_FIELDS.Jurisdiction] = payload.jurisdiction;
  if (payload.sector) fields[ORG_PROFILE_FIELDS.Sector] = payload.sector;
  if (payload.turnover) fields[ORG_PROFILE_FIELDS.Turnover] = String(payload.turnover);
  if (payload.employees) fields[ORG_PROFILE_FIELDS.Employees] = String(payload.employees);
  if (payload.tradedPct !== undefined)
    fields[ORG_PROFILE_FIELDS.TradedPct] = pct(payload.tradedPct);
  if (payload.crossBorderPct !== undefined)
    fields[ORG_PROFILE_FIELDS.CrossBorderPct] = pct(payload.crossBorderPct);

  const result = await airtableFetch(TABLES.ORG_PROFILE, {
    method: "PATCH",
    body: JSON.stringify({
      records: [{ fields }],
      performUpsert: { fieldsToMergeOn: [ORG_PROFILE_FIELDS.OrgCode] },
      typecast: true,
    }),
  });

  return { orgCode, recordId: result.records[0].id, created: !!result.createdRecords?.length };
}

async function appendAuditNote(orgCode, payload) {
  const text = payload.assessment || JSON.stringify(payload, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);

  await airtableFetch(TABLES.NOTES, {
    method: "POST",
    body: JSON.stringify({
      records: [
        {
          fields: {
            [NOTES_FIELDS.OrgCode]: orgCode,
            [NOTES_FIELDS.NoteType]: "Form Submission",
            [NOTES_FIELDS.Date]: dateStr,
            [NOTES_FIELDS.Text]: text,
          },
        },
      ],
    }),
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  if (!process.env.AIRTABLE_PAT || !process.env.AIRTABLE_BASE_ID) {
    console.error("Missing Airtable env vars");
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Server misconfigured — contact Fiona" }),
    };
  }

  let payload;
  try {
    const ct = (event.headers["content-type"] || event.headers["Content-Type"] || "").toLowerCase();
    if (ct.includes("application/json")) {
      payload = JSON.parse(event.body);
    } else {
      payload = Object.fromEntries(new URLSearchParams(event.body));
    }
  } catch (e) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }

  try {
    const { orgCode, recordId } = await upsertOrgProfile(payload);
    await appendAuditNote(orgCode, payload);

    console.log(`[SELECT] Synced ${orgCode} → OrgProfile ${recordId}`);
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, orgCode, recordId }),
    };
  } catch (err) {
    console.error("[SELECT] Sync failed:", err);
    return {
      statusCode: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
