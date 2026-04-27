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
