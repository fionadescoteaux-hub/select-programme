# SELECT Airtable Integration — Setup Guide

## Architecture

```
Browser (assessor.html / tracker.html)
    ↕ fetch('/.netlify/functions/airtable')
Netlify Function (airtable.js)
    ↕ Airtable REST API (PAT in env var)
Airtable Base (app8noXBcVIZDo6Jg)
```

Both pages still use localStorage as a cache/fallback. Airtable is the source of truth.
If Airtable is unreachable, the pages degrade gracefully to localStorage-only mode.

---

## Step 1: Create Airtable Table Columns

In your Airtable base `app8noXBcVIZDo6Jg`, table `tblVt0mpAUrVBFqt7`:

| Column Name       | Field Type     | Purpose                                  |
|-------------------|----------------|------------------------------------------|
| `org_code`        | Single line text | URL slug / unique identifier (e.g. `green-threads`) |
| `org_name`        | Single line text | Organisation name                        |
| `ceo_name`        | Single line text | CEO name                                 |
| `jurisdiction`    | Single line text | ROI or NI                                |
| `baseline_locked` | Checkbox        | Whether baseline is locked (2b)          |
| `intensity`       | Single line text | Stabilise / Strengthen / Scale           |
| `data`            | Long text        | **Full JSON blob** of the org record     |

The `data` column holds the complete organisation object (baseline scores, SMART objectives,
progress logs, consulting cycles, coaching, notes, assessor checklist, etc.) serialised as JSON.
The other columns are extracted for Airtable-native filtering, sorting, and dashboard views.

### Why one record per org with a JSON blob?

The existing data model has ~15 nested objects per organisation. Normalising this into
separate Airtable tables would require 10+ linked tables and complex joins. The JSON-blob
approach means:

- Zero schema changes when fields are added to the app
- Both pages (assessor + tracker) keep their existing data structure
- Airtable still has the key fields exposed for views, filters, and reporting
- One API call per org save (not 10+ linked-record updates)

---

## Step 2: Create an Airtable Personal Access Token (PAT)

1. Go to https://airtable.com/create/tokens
2. Click **Create new token**
3. Name: `SELECT Programme`
4. Scopes: `data.records:read`, `data.records:write`
5. Access: Add base `app8noXBcVIZDo6Jg`
6. Copy the token (starts with `pat...`)

---

## Step 3: Set Netlify Environment Variable

1. Go to https://app.netlify.com → your site (fancy-horse-9e5dd3)
2. Site configuration → Environment variables
3. Add variable:
   - **Key:** `AIRTABLE_PAT`
   - **Value:** your `pat...` token
4. Save

---

## Step 4: Deploy

Your deploy folder should contain:

```
├── netlify.toml                    ← function config
├── netlify/
│   └── functions/
│       └── airtable.js             ← serverless proxy
├── airtable-data.js                ← shared data layer (loaded by both pages)
├── assessor.html                   ← rewired to use AT data layer
├── tracker.html                    ← rewired to use AT data layer
├── index.html                      ← welcome guide (unchanged)
├── assessment.html                 ← CEO assessment (unchanged)
├── endline.html                    ← endline assessment (unchanged)
├── welcome.html                    ← enhanced welcome (unchanged)
├── team.html                       ← programme team (unchanged)
├── SELECT_CEO_Feedback_Template.docx
├── SELECT_Scoring_Reference_Guide.docx
└── select_workbook_complete.docx
```

Drag this entire folder onto the Netlify deploy area, or push via Git.

---

## Step 5: First-Time Migration

If you already have data in localStorage from a previous session:

1. Log in to either `assessor.html` or `tracker.html`
2. Click **Migrate local → Airtable** in the dashboard toolbar
3. This pushes all cached orgs to Airtable as new records
4. Verify in Airtable that records appeared

After migration, both browsers and any new device will see the same data.

---

## How It Works

### Data flow: Save

```
User edits a field → saves
    ↓
saveData() called
    ↓
1. Immediately writes to localStorage (instant)
2. Fires async PUT to /.netlify/functions/airtable
    ↓
Netlify Function forwards to Airtable API
    ↓
Airtable record updated
    ↓
Sync status shows "Saved ✓"
```

### Data flow: Load

```
User logs in
    ↓
1. Immediately renders from localStorage cache
2. Fires async GET to /.netlify/functions/airtable
    ↓
Airtable returns all org records
    ↓
Cache updated with fresh data
    ↓
Dashboard re-renders with latest
```

### Offline / fallback

If Airtable is unreachable, the sync status shows "Offline — using cached data".
All edits still save to localStorage. Next time the user is online and logs in,
they can click **Migrate local → Airtable** to push any offline changes.

---

## Security Notes

- The Airtable PAT never appears in client-side code
- The Netlify Function acts as a proxy — all API calls go server-side
- The `X-Auth` header carries the assessor or CEO password for basic auth
- CEO passwords only grant read access to their own org (via org_code filter)
- The master password (`SELECT2026`) is required for create/delete operations

---

## Airtable Views You Can Build

With the top-level columns exposed, you can create useful Airtable views:

- **Cohort Dashboard**: Grid view grouped by `jurisdiction`, showing `baseline_locked`, `intensity`
- **Locked Baselines**: Filtered view where `baseline_locked` = true
- **By Intensity**: Grouped by `intensity` (Stabilise / Strengthen / Scale)
- **Missing Data**: Filtered where `baseline_locked` = false (orgs still in process)

The `data` column can be expanded in Airtable's record detail view to inspect the full JSON.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "AIRTABLE_PAT not configured" | Env var missing | Add it in Netlify dashboard, redeploy |
| 403 from Airtable | PAT expired or wrong scopes | Regenerate PAT with correct scopes |
| "Offline — using cached data" | Netlify function unreachable | Check deploy status; function may not be deployed |
| Data not syncing between browsers | Migration not done | Click "Migrate local → Airtable" |
| Duplicate orgs in Airtable | Multiple migrations | Delete duplicates in Airtable; keep records with `_recordId` |
