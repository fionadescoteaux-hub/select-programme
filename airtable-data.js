// ═══════════════════════════════════════════════════════════════
// SELECT Programme — Airtable Data Layer
// Version: 2026-05-27-SMART-DUPLICATE-CASCADE-FIX
//
// CRITICAL SAFETY RULES (prevent Airtable wipes):
// 1. NEVER push to Airtable until loadData() succeeds at least once.
// 2. NEVER push an org that fails isOrgSafeToPush() — must have real data.
// 3. Cache writes are always allowed and unconditional (local data is safe).
//
// MULTI-USER FIX (2026-05-20):
// Fiona and Clodagh share the same Airtable. Previously each save pushed the
// user's entire local org blob, so whoever saved last overwrote the other's
// edits — visible as different mentoring/coaching hour totals on each login.
// pushOrg() now does a read-merge-write: fetch latest Airtable state, merge
// local edits into it, then push. loadData() also flipped to "Airtable wins
// for shared per-row fields"; cache only fills empty slots.
//
// SMART MERGE FIX (2026-05-22):
// Before this fix, pushOrg() replaced Airtable's SMART rows wholesale whenever
// local org.smart had any rows. Result: opening the SMART tab with stale
// localStorage data overwrote clean Airtable rows with stale duplicates.
// SMART now merges per-row by _rid using mergeRowsByRid: Airtable rows are
// preserved unless local has the same _rid AND non-empty edits.
// TRADE-OFF: deleting a SMART row from the UI no longer propagates to
// Airtable via push — deletes must be done at the Airtable layer for now.
// This is the safer failure mode; data preservation > delete convenience.
// ═══════════════════════════════════════════════════════════════

var AT = (function() {
  'use strict';

  var API        = '/api/airtable';
  var CACHE_KEY  = 'select_tracker_v4';
  var BACKUP_KEY = 'select_tracker_v4_bak';
  var SYNC_KEY   = 'select_sync_ts';
  var STAMP_KEY  = 'select_save_stamp';
  var DIRTY_KEY  = 'select_dirty_orgs';   // FIX: org codes edited locally but not yet confirmed on Airtable

  var authToken            = '';
  var _online              = true;
  var _statusEl            = null;
  var _initialLoadComplete = false;  // THE KEY GUARD
  var _pendingPush         = [];
  var _loadedByCode        = {};   // per-session snapshot of what THIS user loaded (for clear-detection)

  var _storageOk = (function(){
    try { localStorage.setItem('_st','1'); localStorage.removeItem('_st'); return true; }
    catch(e) { return false; }
  })();

  if (!_storageOk) {
    setTimeout(function(){
      alert('⚠️ Browser is blocking local storage. Switch to a normal browser window.');
    }, 800);
  }

  function setStatus(msg, type) {
    if (!_statusEl) _statusEl = document.getElementById('syncStatus');
    if (_statusEl) {
      _statusEl.textContent = msg;
      _statusEl.className = 'sync-status sync-' + (type || 'info');
      _statusEl.style.display = msg ? 'block' : 'none';
    }
    if (type === 'ok' && msg && msg.indexOf('Saved') > -1) _updateStamp();
  }

  function _updateStamp() {
    var el = document.getElementById('saveStamp'); if (!el) return;
    var iso = localStorage.getItem(STAMP_KEY); if (!iso) return;
    var d = new Date(iso);
    el.textContent = 'Last saved: ' +
      d.toLocaleDateString('en-IE', {day:'numeric',month:'short',year:'numeric'}) +
      ' at ' + d.toLocaleTimeString('en-IE', {hour:'2-digit',minute:'2-digit'});
  }

  function cacheGet() {
    try {
      var d = localStorage.getItem(CACHE_KEY);
      if (d) { var p = JSON.parse(d); if (p && Array.isArray(p.orgs)) return p; }
    } catch(e) {}
    try {
      var b = localStorage.getItem(BACKUP_KEY);
      if (b) { var p2 = JSON.parse(b); if (p2 && Array.isArray(p2.orgs)) {
        try { localStorage.setItem(CACHE_KEY, b); } catch(e2) {}
        return p2;
      } }
    } catch(e3) {}
    return { orgs: [] };
  }

  function cacheSet(data) {
    if (!_storageOk) return;
    try {
      var str = JSON.stringify(data);
      localStorage.setItem(CACHE_KEY, str);
      localStorage.setItem(BACKUP_KEY, str);
      var now = new Date().toISOString();
      localStorage.setItem(SYNC_KEY, now);
      localStorage.setItem(STAMP_KEY, now);
      _updateStamp();
    } catch(e) {
      try {
        localStorage.removeItem(BACKUP_KEY);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch(e2) {
        setStatus('⚠ Local save failed — use Export', 'err');
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SAFETY: only push orgs with substantive data
  // ═══════════════════════════════════════════════════════════════
  function isOrgSafeToPush(org) {
    if (!org || !org.code || !org.name) return false;
    if (org.baselineLocked) return true;
    if (org.intensity) return true;
    if (org.baselineNotes && org.baselineNotes.length > 5) return true;
    if (Array.isArray(org.baseline)) {
      for (var i = 0; i < org.baseline.length; i++) {
        if (org.baseline[i] && (org.baseline[i].score !== '' || org.baseline[i].evidence)) return true;
      }
    }
    if (Array.isArray(org.smart) && org.smart.length > 0) {
      for (var j = 0; j < org.smart.length; j++) {
        if (org.smart[j] && org.smart[j].objective) return true;
      }
    }
    if (Array.isArray(org.notes) && org.notes.length > 0) return true;
    if (Array.isArray(org.consulting)) {
      for (var k = 0; k < org.consulting.length; k++) {
        var c = org.consulting[k];
        if (c && (c.consultedBy || c.actionsAgreed || c.keyOutputs || c.hours || c.completed || c.links)) return true;
      }
    }
    if (Array.isArray(org.coaching)) {
      for (var l = 0; l < org.coaching.length; l++) {
        var co = org.coaching[l];
        if (co && (co.hours || co.theme || co.actionAgreed || co.completed)) return true;
      }
    }
    if (Array.isArray(org.attendance)) {
      for (var m = 0; m < org.attendance.length; m++) {
        if (org.attendance[m] && (org.attendance[m].attended || org.attendance[m].apology)) return true;
      }
    }
    if (org.diagnosis && org.diagnosis.problemStatement && org.diagnosis.problemStatement.length > 10) return true;
    if (org.financial) {
      for (var fkey in org.financial) {
        if (org.financial[fkey] && String(org.financial[fkey]).trim() !== '') return true;
      }
    }
    return false;
  }

  function request(method, params, body) {
    var url = API;
    if (params) {
      var qs = Object.keys(params).map(function(k){ return encodeURIComponent(k)+'='+encodeURIComponent(params[k]); }).join('&');
      if (qs) url += '?' + qs;
    }
    var opts = { method: method, headers: { 'Content-Type': 'application/json', 'X-Auth': authToken } };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function(res){
      if (!res.ok) return res.text().then(function(t){ var e = new Error('API '+res.status+': '+t); e.status = res.status; throw e; });
      return res.json();
    });
  }

  function loadData(callback) {
    setStatus('Syncing…', 'info');
    request('POST', null, { action: 'list' })
      .then(function(data) {
        _online = true;
        if (data.orgs) {
          var cached = cacheGet();
          var cacheMap = {};
          (cached.orgs || []).forEach(function(o){ cacheMap[o.code] = o; });

          data.orgs.forEach(function(o) {
            if (!o.baseline)    o.baseline    = [];
            if (!o.endline)     o.endline     = [];
            if (!o.smart)       o.smart       = [];
            if (!o.notes)       o.notes       = [];
            if (!o.consulting)  o.consulting  = [];
            if (!o.coaching)    o.coaching    = [];
            if (!o.attendance)  o.attendance  = [];
            if (!o.kpi)         o.kpi         = {};
            if (!o.app)         o.app         = {};
            if (!o.financial)   o.financial   = {};
            if (!o.assessor || typeof o.assessor !== 'object') o.assessor = {};
            if (!o.diagnosis)   o.diagnosis   = {};
            if (!o.sop)         o.sop         = {};
            if (!o.crossBorder) o.crossBorder = {};
            if (!o.actionPlan || typeof o.actionPlan !== 'object') o.actionPlan = {};
            if (!o._uiLocks   || typeof o._uiLocks   !== 'object') o._uiLocks   = {};
            if (typeof o.baselineNotes !== 'string') o.baselineNotes = '';
            if (typeof o.baselineReportUrl !== 'string') o.baselineReportUrl = '';
            if (typeof o.baseline_structure !== 'string') o.baseline_structure = 'domain';

            // CACHE PROTECTS LOCAL EDITS: if cache has data Airtable returned empty, keep cache
            var co = cacheMap[o.code];
            if (co) {
              // Notes: keep whichever has more entries
              if ((co.notes || []).length > (o.notes || []).length) o.notes = co.notes;

              // For consulting/coaching/attendance, merge per-row by code.
              // AIRTABLE WINS: Airtable is the shared source of truth across both
              // assessors. The cache only fills in fields Airtable has left empty
              // (e.g. a row the user has typed into but not yet successfully synced).
              // This prevents one user's stale cache from overwriting the other
              // user's saved edits — the previous "cache always wins" rule caused
              // mentoring/coaching hours to drift between Fiona and Clodagh.
              ['consulting','coaching','attendance'].forEach(function(key){
                if (!Array.isArray(o[key]) || !Array.isArray(co[key])) return;
                var cacheByCode = {};
                co[key].forEach(function(r){ if (r && r.code) cacheByCode[r.code] = r; });
                o[key] = o[key].map(function(airtableRow){
                  if (!airtableRow || !airtableRow.code) return airtableRow;
                  var cacheRow = cacheByCode[airtableRow.code];
                  if (!cacheRow) return airtableRow;
                  // Airtable row is the base. Cache only fills in fields that
                  // Airtable has as empty/null/undefined (NOT false — false is a
                  // valid saved value for `completed` booleans).
                  var merged = Object.assign({}, airtableRow);
                  Object.keys(cacheRow).forEach(function(field){
                    if (field === '_rid') return;
                    var airtableVal = airtableRow[field];
                    var cacheVal = cacheRow[field];
                    var airtableEmpty = (airtableVal === '' || airtableVal === null || airtableVal === undefined);
                    var cacheHasValue = (cacheVal !== '' && cacheVal !== null && cacheVal !== undefined);
                    if (airtableEmpty && cacheHasValue) {
                      merged[field] = cacheVal;
                    }
                  });
                  return merged;
                });
                // Also keep cache-only rows (rows in cache with no matching Airtable row)
                var airtableCodes = {};
                o[key].forEach(function(r){ if (r && r.code) airtableCodes[r.code] = 1; });
                co[key].forEach(function(r){ if (r && r.code && !airtableCodes[r.code]) o[key].push(r); });
              });

              // SMART: AIRTABLE WINS, per-row merge by _rid with content-based
              // de-dup fallback for legacy cache rows that lost their _rid.
              // 2026-05-27 fix: the old array-index "cache wins wholesale" logic
              // caused a duplicate cascade — cache rows with no _rid replaced
              // Airtable's rows with _rid, then the save side appended every
              // no-_rid local row as a new Airtable record. Every reload doubled
              // the row count (8 → 16 → 32 → ...).
              // New behaviour: remote rows (with _rid) are always kept. Cache
              // rows merge their non-empty edits into the matching remote row,
              // matched first by _rid, then (if no _rid) by objective text. Only
              // truly orphan cache rows (no _rid AND no content match) are
              // appended, treated as local-only new rows the user added but
              // hasn't pushed yet.
              if (Array.isArray(co.smart) && co.smart.length > 0) {
                o.smart = mergeRowsByRid(o.smart, co.smart);
              }

              // KPI: per-field merge — Airtable wins. Cache only fills in
              // fields Airtable returned as empty. Previously the absence of
              // any kpi merge rule meant the RAG fields (ragMode, ragBaseline,
              // ragCurrent, ragSurplus, ragCbSales, ragNextActions) saved to
              // Airtable would be blanked on every reload because the stale
              // cached kpi values from before the save took precedence later
              // in the merge chain. Same pattern as the per-row consulting/
              // coaching/attendance merge above.
              if (co.kpi && typeof co.kpi === 'object') {
                if (!o.kpi || typeof o.kpi !== 'object') o.kpi = {};
                Object.keys(co.kpi).forEach(function(k){
                  var airtableVal = o.kpi[k];
                  var cacheVal = co.kpi[k];
                  var airtableEmpty = (airtableVal === '' || airtableVal === null || airtableVal === undefined);
                  var cacheHasValue = (cacheVal !== '' && cacheVal !== null && cacheVal !== undefined);
                  if (airtableEmpty && cacheHasValue) {
                    o.kpi[k] = cacheVal;
                  }
                });
              }

              // App-stage data: same per-field merge as kpi above. The app
              // object holds the application-stage fields (turnover, employees,
              // tradedPct, crossBorderPct, priorITI, crossBorderTarget) which
              // had the same stale-cache risk as the RAG fields.
              if (co.app && typeof co.app === 'object') {
                if (!o.app || typeof o.app !== 'object') o.app = {};
                Object.keys(co.app).forEach(function(k){
                  var airtableVal = o.app[k];
                  var cacheVal = co.app[k];
                  var airtableEmpty = (airtableVal === '' || airtableVal === null || airtableVal === undefined);
                  var cacheHasValue = (cacheVal !== '' && cacheVal !== null && cacheVal !== undefined);
                  if (airtableEmpty && cacheHasValue) {
                    o.app[k] = cacheVal;
                  }
                });
              }

              // Cross-border: same per-field merge.
              if (co.crossBorder && typeof co.crossBorder === 'object') {
                if (!o.crossBorder || typeof o.crossBorder !== 'object') o.crossBorder = {};
                Object.keys(co.crossBorder).forEach(function(k){
                  var airtableVal = o.crossBorder[k];
                  var cacheVal = co.crossBorder[k];
                  var airtableEmpty = (airtableVal === '' || airtableVal === null || airtableVal === undefined);
                  var cacheHasValue = (cacheVal !== '' && cacheVal !== null && cacheVal !== undefined);
                  if (airtableEmpty && cacheHasValue) {
                    o.crossBorder[k] = cacheVal;
                  }
                });
              }

              // Assessor (validation, goals, checklist, priorities, lock):
              // per-section merge. Airtable wins. Cache only fills in keys
              // Airtable returned empty. This protects RAG and SMART data and
              // also restores the same protection for Validation Notes and
              // Goals & SMART Translation that previously could be wiped by
              // stale cache after an Airtable round-trip.
              if (co.assessor && typeof co.assessor === 'object') {
                if (!o.assessor || typeof o.assessor !== 'object') o.assessor = {};
                ['validation','goals','checklist','lock'].forEach(function(section){
                  if (!co.assessor[section] || typeof co.assessor[section] !== 'object') return;
                  if (!o.assessor[section] || typeof o.assessor[section] !== 'object') o.assessor[section] = {};
                  Object.keys(co.assessor[section]).forEach(function(k){
                    var airtableVal = o.assessor[section][k];
                    var cacheVal = co.assessor[section][k];
                    var airtableEmpty = (airtableVal === '' || airtableVal === null || airtableVal === undefined);
                    var cacheHasValue = (cacheVal !== '' && cacheVal !== null && cacheVal !== undefined);
                    if (airtableEmpty && cacheHasValue) {
                      o.assessor[section][k] = cacheVal;
                    }
                  });
                });
                // priorities is an array, not an object — keep cache only if Airtable returned empty
                if (Array.isArray(co.assessor.priorities) && co.assessor.priorities.length > 0
                    && (!Array.isArray(o.assessor.priorities) || o.assessor.priorities.length === 0)) {
                  o.assessor.priorities = co.assessor.priorities;
                }
                // Lead assessor name (string)
                if (co.assessor.assessor && !o.assessor.assessor) o.assessor.assessor = co.assessor.assessor;
              }

              // Baseline scores: per-domain merge
              if (Array.isArray(o.baseline) && Array.isArray(co.baseline)) {
                o.baseline = o.baseline.map(function(airtableRow, idx){
                  var cacheRow = co.baseline[idx];
                  if (!cacheRow) return airtableRow;
                  var merged = Object.assign({}, airtableRow);
                  if ((cacheRow.score !== '' && cacheRow.score !== null && cacheRow.score !== undefined) &&
                      (airtableRow.score === '' || airtableRow.score === null || airtableRow.score === undefined)) {
                    merged.score = cacheRow.score;
                  }
                  if (cacheRow.evidence && !airtableRow.evidence) merged.evidence = cacheRow.evidence;
                  return merged;
                });
              }

              // Diagnosis problem statement
              if (co.diagnosis && co.diagnosis.problemStatement && !(o.diagnosis && o.diagnosis.problemStatement)) o.diagnosis = co.diagnosis;
              if (co.baselineNotes && !o.baselineNotes) o.baselineNotes = co.baselineNotes;
              if (co.intensity && !o.intensity) o.intensity = co.intensity;
              if (co.baselineLocked && !o.baselineLocked) o.baselineLocked = true;
              if (co.financial && Object.keys(co.financial).length > 0 && Object.keys(o.financial || {}).length === 0) o.financial = co.financial;
              // actionPlan and _uiLocks: keep cache version if Airtable returned empty
              if (co.actionPlan && Object.keys(co.actionPlan).length > 0 && Object.keys(o.actionPlan || {}).length === 0) o.actionPlan = co.actionPlan;
              if (co._uiLocks   && Object.keys(co._uiLocks).length   > 0 && Object.keys(o._uiLocks   || {}).length === 0) o._uiLocks   = co._uiLocks;
            }
          });
        }

        // _rid values are KEPT in cache so client knows which records exist.
        // (Earlier versions stripped these "for safety" but doing so caused
        // every push to look like a new-org create, generating duplicates.)

        // Snapshot what THIS user loaded, so the push-time merge can tell a
        // deliberate field CLEAR (loaded a value, then blanked it) from a field
        // the user simply never saw (a co-assessor's value). Without this, an
        // empty value could never overwrite a stored one, so deletions silently
        // reappeared on the next sync.
        _loadedByCode = {};
        if (data && Array.isArray(data.orgs)) {
          data.orgs.forEach(function(o){
            if (o && o.code) { try { _loadedByCode[o.code] = JSON.parse(JSON.stringify(o)); } catch (e) {} }
          });
        }

        cacheSet(data);
        _initialLoadComplete = true;  // unlock pushes
        _flushDirty();                // FIX: replay any edits stranded before sync completed
        setStatus('Synced \u2713', 'ok');
        setTimeout(function(){ setStatus('', 'ok'); }, 3000);
        if (callback) callback(data);
      })
      .catch(function(err){
        console.warn('Airtable fetch failed:', err.message);
        _online = false;
        setStatus('Offline — using cached data', 'warn');
        var cached = cacheGet();
        if (callback) callback(cached);
      });
  }

  function loadDataSync() { return cacheGet(); }

  // ════════════════════════════════════════════════════════════════
  // FIX (silent data loss): persistent "dirty org" set.
  //
  // Every edit always lands in localStorage (cacheSet), but the push to
  // Airtable can be gated out — initial sync not yet complete, no auth token,
  // offline, or rate-limited. Previously those edits were cached and then
  // dropped silently with only a transient "Saved locally" warning, and were
  // never retried unless the user happened to edit again that session. If the
  // initial load failed at open, EVERY edit that session was lost from Airtable.
  //
  // We now record the org code in localStorage (survives refresh), replay it
  // automatically whenever a push becomes possible, and clear it only on a
  // CONFIRMED Airtable success. This is what the unused `_pendingPush` was for.
  // ════════════════════════════════════════════════════════════════
  function _getDirty() {
    try { var a = JSON.parse(localStorage.getItem(DIRTY_KEY) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function _setDirty(arr) {
    try { localStorage.setItem(DIRTY_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function _markDirty(code) {
    if (!code) return;
    var a = _getDirty();
    if (a.indexOf(code) === -1) { a.push(code); _setDirty(a); }
    _pendingBanner();
  }
  function _clearDirty(code) {
    if (!code) return;
    _setDirty(_getDirty().filter(function(c){ return c !== code; }));
    _pendingBanner();
  }
  function _pendingBanner() {
    var n = _getDirty().length;
    if (n > 0) setStatus('\u26a0 ' + n + ' change' + (n === 1 ? '' : 's') + ' saved locally, not yet on Airtable', 'warn');
  }
  // Replay every locally-stranded org. Safe to call repeatedly: pushOrg routes
  // through the same debounced, backoff-aware queue, and success clears the flag.
  function _flushDirty() {
    if (!_initialLoadComplete || !authToken || !_online) return;
    var codes = _getDirty();
    if (!codes.length) return;
    var snap = cacheGet();
    if (!snap || !Array.isArray(snap.orgs)) return;
    codes.forEach(function(code){
      var org = null;
      for (var i = 0; i < snap.orgs.length; i++) { if (snap.orgs[i].code === code) { org = snap.orgs[i]; break; } }
      if (!org)                    { _clearDirty(code); return; }  // org gone locally
      if (!isOrgSafeToPush(org))   { _clearDirty(code); return; }  // nothing substantive to push
      pushOrg(org);                                                // success path clears the flag
    });
  }

  function saveData(data, changedOrgCode) {
    // Cache is always safe to write
    cacheSet(data);

    if (!changedOrgCode) return;
    var org = null;
    for (var i = 0; i < data.orgs.length; i++) {
      if (data.orgs[i].code === changedOrgCode) { org = data.orgs[i]; break; }
    }
    if (!org) return;

    // SAFETY GATES - all four must pass before pushing to Airtable.
    // FIX: when a gate that is merely "not ready yet" blocks the push, record
    // the org as dirty so it is replayed automatically once we CAN push. Without
    // this, an edit made before the initial sync completed (or while offline /
    // rate-limited) was cached locally and then silently never reached Airtable.
    if (!_initialLoadComplete) { _markDirty(changedOrgCode); setStatus('Saved locally — will sync when ready', 'warn'); return; }
    if (!authToken)            { _markDirty(changedOrgCode); setStatus('Saved locally', 'warn'); return; }
    if (!_online)              { _markDirty(changedOrgCode); setStatus('Saved locally (offline) — will retry', 'warn'); return; }
    if (!isOrgSafeToPush(org)) {
      console.warn('[AT] Skipping push of empty org:', org.code);
      setStatus('Saved locally', 'warn');
      return;
    }

    // FIX: mark dirty BEFORE the push; the queue clears it only on confirmed
    // success, so a refresh or crash mid-push still replays the edit next load.
    _markDirty(changedOrgCode);
    pushOrg(org);
  }

  // ── Serialised, debounced, backoff-aware save queue ──────────────────
  // Airtable allows ~5 requests/sec per base. Each UPDATE below is two calls
  // (list + update), and the UI can fire saveData many times in a burst
  // (per-field blur, re-renders). Without throttling those stack up, Airtable
  // returns 429 RATE_LIMIT_REACHED (the function relays it as a 500 whose body
  // contains that text), the tracker drops to "Saved locally (offline)" and
  // never recovers because every retry re-trips the limit. This queue collapses
  // bursts (debounce), runs at most one push at a time with a minimum gap, and
  // backs off on 429 instead of marking the whole tracker offline.

  var _saveQueue        = {};     // code -> { org, callbacks, retries, dirty, ready }
  var _saveTimers       = {};     // code -> debounce timeout id
  var _runnerBusy       = false;
  var _activeCode       = null;
  var _lastPushAt       = 0;
  var _rateLimitedUntil = 0;
  var SAVE_DEBOUNCE_MS  = 1000;   // collapse a burst of edits into one push
  var MIN_PUSH_GAP_MS   = 1200;   // minimum gap between push starts
  var MAX_PUSH_RETRIES  = 5;      // 2+4+8+16+30 = ~60s, covers Airtable's penalty window

  function _isRateLimit(err) {
    if (!err) return false;
    if (err.status === 429) return true;
    var m = err.message || '';
    return /RATE_LIMIT_REACHED|Airtable 429|\b429\b/i.test(m);
  }

  // PUBLIC: gate, then hand off to the queue. Never fires the network directly.
  function pushOrg(org, callback) {
    if (!_initialLoadComplete) { console.warn('[AT.pushOrg] BLOCKED: initial sync not complete'); if (callback) callback(false); return; }
    if (!authToken)            { console.warn('[AT.pushOrg] BLOCKED: no auth token');             if (callback) callback(false); return; }
    if (!org || !org.code)     { console.warn('[AT.pushOrg] BLOCKED: empty org');                 if (callback) callback(false); return; }
    if (!isOrgSafeToPush(org)) { console.warn('[AT.pushOrg] skipped — empty org:', org.code);     if (callback) callback(false); return; }
    _queuePush(org, callback);
  }

  function _queuePush(org, callback) {
    var code  = org.code;
    var entry = _saveQueue[code];
    if (!entry) { entry = _saveQueue[code] = { callbacks: [], retries: 0, dirty: false, ready: false }; }
    entry.org = org;                                  // latest snapshot always wins
    if (callback) entry.callbacks.push(callback);

    if (code === _activeCode) { entry.dirty = true; return; }  // edited mid-flight; re-run after

    if (_saveTimers[code]) clearTimeout(_saveTimers[code]);
    setStatus('Saving…', 'info');
    _saveTimers[code] = setTimeout(function(){
      delete _saveTimers[code];
      entry.ready = true;
      _runQueue();
    }, SAVE_DEBOUNCE_MS);
  }

  function _runQueue() {
    if (_runnerBusy) return;
    var codes = Object.keys(_saveQueue).filter(function(c){ return _saveQueue[c].ready; });
    if (!codes.length) return;

    var now  = Date.now();
    var wait = 0;
    if (_rateLimitedUntil > now) wait = _rateLimitedUntil - now;
    if (now - _lastPushAt < MIN_PUSH_GAP_MS) wait = Math.max(wait, MIN_PUSH_GAP_MS - (now - _lastPushAt));

    _runnerBusy = true;
    setTimeout(function(){
      var code  = codes[0];
      var entry = _saveQueue[code];
      if (!entry) { _runnerBusy = false; _runQueue(); return; }

      _activeCode = code;
      _lastPushAt = Date.now();
      setStatus('Saving…', 'info');

      _doPushOrg(entry.org)
        .then(function(){
          _online = true;
          _activeCode = null;
          _clearDirty(code);                 // FIX: confirmed on Airtable — drop the dirty flag
          setStatus('Saved \u2713', 'ok');
          setTimeout(function(){ setStatus('', 'ok'); }, 2000);
          _finish(code, true);
        })
        .catch(function(err){
          _activeCode = null;

          if (_isRateLimit(err)) {
            entry.retries = (entry.retries || 0) + 1;
            if (entry.retries <= MAX_PUSH_RETRIES) {
              var backoff = Math.min(30000, 2000 * Math.pow(2, entry.retries - 1));
              _rateLimitedUntil = Date.now() + backoff;
              _online = true;                       // 429 means throttled, NOT offline
              setStatus('Airtable busy — retrying in ' + Math.round(backoff / 1000) + 's…', 'warn');
              _runnerBusy = false;
              entry.ready = true;                   // keep entry; try again after backoff
              setTimeout(_runQueue, backoff);
              return;
            }
            _online = true;
            setStatus('Save paused (Airtable rate limit) — kept locally, will retry on next edit', 'warn');
            _finish(code, false);
            return;
          }

          if (typeof err.status === 'number') {
            // Server responded with an error — we ARE online; this payload failed.
            _online = true;
            console.warn('[AT] save failed (' + err.status + '):', err.message);
            setStatus('Save failed — kept locally', 'warn');
            _finish(code, false);
            return;
          }

          // fetch itself threw — genuinely offline.
          _online = false;
          console.warn('[AT] network error — offline:', err && err.message);
          setStatus('Saved locally (offline)', 'warn');
          _finish(code, false);
        });
    }, wait);
  }

  function _finish(code, ok) {
    var entry = _saveQueue[code];
    _runnerBusy = false;

    if (entry && entry.dirty && ok) {
      // Edited again while this push was in flight — re-run with the newest data.
      entry.dirty   = false;
      entry.ready   = true;
      entry.retries = 0;
      if (entry.callbacks && entry.callbacks.length) {
        entry.callbacks.forEach(function(cb){ try { cb(true); } catch (e) {} });
        entry.callbacks = [];
      }
      setTimeout(_runQueue, 0);
      return;
    }

    delete _saveQueue[code];
    if (entry && entry.callbacks) entry.callbacks.forEach(function(cb){ try { cb(ok); } catch (e) {} });
    setTimeout(_runQueue, 0);
  }

  // Performs the actual network write for one org and returns a Promise.
  // Create, or read-merge-write update. Throttling / retry / status are all
  // handled by the queue above — this only builds and sends the request.
  function _doPushOrg(org) {
    var isNew = !org._rid;

    if (isNew) {
      var newPayload = {
        action: 'create', password: authToken,
        name: org.name || '', ceo: org.ceo || '', code: org.code || '',
        jurisdiction: (org.kpi && org.kpi.jurisdiction) || 'ROI'
      };
      return request('POST', null, newPayload);
    }

    // READ-MERGE-WRITE for updates: fetch the current Airtable state for THIS
    // org, merge the local change into the latest shared record, then write.
    return request('POST', null, { action: 'list' })
      .then(function(latest){
        var latestOrg = null;
        if (latest && Array.isArray(latest.orgs)) {
          for (var i = 0; i < latest.orgs.length; i++) {
            if (latest.orgs[i].code === org.code) { latestOrg = latest.orgs[i]; break; }
          }
        }

        var basis  = latestOrg ? latestOrg : org;
        var loaded = _loadedByCode[org.code] || {};
        var merged = {
          kpi:          mergeObj(basis.kpi, org.kpi, loaded.kpi),
          app:          mergeObj(basis.app, org.app, loaded.app),
          diagnosis:    mergeObj(basis.diagnosis, org.diagnosis, loaded.diagnosis),
          crossBorder:  mergeObj(basis.crossBorder, org.crossBorder, loaded.crossBorder),
          financial:    mergeObj(basis.financial, org.financial, loaded.financial),
          assessor:     mergeObj(basis.assessor, org.assessor, loaded.assessor),
          baseline:     mergeRowsByIndex(basis.baseline, org.baseline, loaded.baseline),
          endline:      mergeRowsByIndex(basis.endline, org.endline, loaded.endline),
          smart:        mergeRowsByRid(basis.smart, org.smart, loaded.smart),
          notes:        unionNotes(basis.notes, org.notes),
          consulting:   mergeRowsByCode(basis.consulting, org.consulting, loaded.consulting),
          coaching:     mergeRowsByCode(basis.coaching,   org.coaching,   loaded.coaching),
          attendance:   mergeRowsByCode(basis.attendance, org.attendance, loaded.attendance),
          progress:     org.progress || basis.progress || [],
          baselineLocked: !!(org.baselineLocked || basis.baselineLocked),
          intensity:      _mergeField(org.intensity, basis.intensity, loaded.intensity),
          baselineNotes:  _mergeField(org.baselineNotes, basis.baselineNotes, loaded.baselineNotes),
          baselineReportUrl: _mergeField(org.baselineReportUrl, basis.baselineReportUrl, loaded.baselineReportUrl),
          baseline_structure: org.baseline_structure || basis.baseline_structure || 'domain',
          actionPlan:     (org.actionPlan && Object.keys(org.actionPlan).length) ? org.actionPlan : (basis.actionPlan || {}),
          _uiLocks:       (org._uiLocks   && Object.keys(org._uiLocks).length)   ? org._uiLocks   : (basis._uiLocks   || {})
        };

        var payload = {
          action: 'update', password: authToken, code: org.code,
          kpi: merged.kpi, app: merged.app, diagnosis: merged.diagnosis,
          crossBorder: merged.crossBorder, financial: merged.financial,
          baseline: merged.baseline, endline: merged.endline,
          smart: merged.smart, consulting: merged.consulting,
          coaching: merged.coaching, attendance: merged.attendance,
          progress: merged.progress, notes: merged.notes,
          baselineLocked: merged.baselineLocked,
          intensity: merged.intensity,
          baselineNotes: merged.baselineNotes,
          baselineReportUrl: merged.baselineReportUrl,
          baseline_structure: merged.baseline_structure,
          assessor: merged.assessor,
          actionPlan: merged.actionPlan,
          _uiLocks: merged._uiLocks
        };

        return request('POST', null, payload);
      });
  }

  // ── Merge helpers used by read-merge-write pushOrg ──
  // ── Three-way field merge primitives ──
  // local  = value in this user's UI now
  // base   = latest value in Airtable (fresh read at push time)
  // loaded = value this user loaded at the start of the session
  function _isEmptyVal(v){ return v === '' || v === null || v === undefined; }
  function _eqVal(a, b){
    if (a === b) return true;
    if (_isEmptyVal(a) && _isEmptyVal(b)) return true;
    return String(a) === String(b);
  }
  // Decide the value to write for one field:
  //  - a non-empty local value always wins (an intentional set);
  //  - an empty local value clears the field ONLY if the user loaded that exact
  //    value and nobody changed it since (a deliberate delete); otherwise the
  //    base value is kept, so a co-assessor's value the user never saw is safe;
  //  - booleans: an explicit local tick/untick wins only when it differs from
  //    what the user loaded AND the base hasn't moved underneath.
  function _mergeField(local, base, loaded) {
    if (typeof local === 'boolean') {
      var ldb = (loaded === true);
      if (local === ldb) return base;                 // user didn't change it
      if ((base === true) === ldb) return local;      // no concurrent change -> apply
      return base;                                    // concurrent change -> protect base
    }
    if (!_isEmptyVal(local)) return local;            // intentional value wins
    if (_isEmptyVal(base))   return base;             // nothing to preserve
    if (!_isEmptyVal(loaded) && _eqVal(loaded, base)) return '';  // deliberate clear
    return base;                                      // never saw it / concurrent change
  }

  // mergeObj: three-way merge over the keys the user's local object carries;
  // remote-only keys are preserved untouched.
  function mergeObj(remote, local, loaded) {
    var r  = remote && typeof remote === 'object' ? remote : {};
    var l  = local  && typeof local  === 'object' ? local  : {};
    var ld = loaded && typeof loaded === 'object' ? loaded : {};
    var out = {};
    Object.keys(r).forEach(function(k){ out[k] = r[k]; });
    Object.keys(l).forEach(function(k){
      out[k] = _mergeField(l[k], (k in r ? r[k] : undefined), ld[k]);
    });
    return out;
  }
  // mergeRowsByRid: per-row, per-field merge keyed on `_rid` (for SMART).
  // Airtable rows are preserved unless local has same _rid with non-empty edits.
  // Local rows without _rid are first matched against remote rows by objective
  // text (content-based de-dup); truly orphan local rows are then appended as
  // new. Airtable rows that local doesn't have are kept (no delete via push).
  //
  // 2026-05-27 fix: prior version blindly appended every local-no-_rid row,
  // which combined with a broken load-merge produced an exponential duplicate
  // cascade. Content-based de-dup is the safety net that keeps stale cache
  // entries (from sessions before _rid tracking) from re-creating themselves
  // as new Airtable records on every save.
  function mergeRowsByRid(remoteRows, localRows, loadedRows) {
    var r = Array.isArray(remoteRows) ? remoteRows : [];
    var l = Array.isArray(localRows)  ? localRows  : [];
    if (!r.length && !l.length) return [];
    if (!l.length) return r;
    var localByRid = {};
    var localWithoutRid = [];
    l.forEach(function(row){
      if (!row) return;
      if (row._rid) localByRid[row._rid] = row;
      else localWithoutRid.push(row);
    });
    var loadedByRid = {};
    (Array.isArray(loadedRows) ? loadedRows : []).forEach(function(row){
      if (row && row._rid) loadedByRid[row._rid] = row;
    });

    // Normalise objective text for content-based matching: trim, collapse
    // whitespace, lowercase. Empty/missing objectives can't be content-matched.
    function _objKey(row) {
      if (!row) return '';
      var o = row.objective;
      if (!o || typeof o !== 'string') return '';
      return o.replace(/\s+/g, ' ').trim().toLowerCase();
    }

    // Build a content index of remote rows so each orphan local row can find
    // its remote twin without an O(N*M) scan. Multiple remote rows with the
    // same objective text are rare but possible; we match the first.
    var remoteByObj = {};
    r.forEach(function(remoteRow){
      var key = _objKey(remoteRow);
      if (key && !remoteByObj[key]) remoteByObj[key] = remoteRow;
    });

    // For each orphan local row, look for a remote twin by objective text.
    // If found, fold the local row's non-empty edits into its _rid bucket so
    // the regular _rid merge below picks it up. If not, keep it as a true
    // orphan to be appended.
    var trueOrphans = [];
    localWithoutRid.forEach(function(localRow){
      var key = _objKey(localRow);
      var remoteTwin = key ? remoteByObj[key] : null;
      if (remoteTwin && remoteTwin._rid) {
        var bucket = localByRid[remoteTwin._rid];
        if (!bucket) {
          // Re-key the orphan under the matched remote _rid.
          localByRid[remoteTwin._rid] = Object.assign({ _rid: remoteTwin._rid }, localRow);
        } else {
          // A local row already exists for this _rid; merge non-empty fields
          // from the orphan into the existing bucket (local wins for non-empty).
          Object.keys(localRow).forEach(function(field){
            if (field === '_rid') return;
            var v = localRow[field];
            if (v !== '' && v !== null && v !== undefined && typeof v !== 'boolean') {
              bucket[field] = v;
            }
          });
        }
      } else if (key) {
        // True orphan: a local row with content that doesn't match any remote.
        // Keep for append. (Empty-objective rows are dropped — they're noise.)
        trueOrphans.push(localRow);
      }
    });

    var out = r.map(function(remoteRow){
      if (!remoteRow || !remoteRow._rid) return remoteRow;
      var localRow = localByRid[remoteRow._rid];
      if (!localRow) return remoteRow;
      var loadedRow = loadedByRid[remoteRow._rid] || {};
      var merged = Object.assign({}, remoteRow);
      Object.keys(localRow).forEach(function(field){
        if (field === '_rid') return;
        merged[field] = _mergeField(localRow[field], remoteRow[field], loadedRow[field]);
      });
      return merged;
    });
    // Append true orphan local rows (no _rid AND no content match against remote).
    trueOrphans.forEach(function(row){ out.push(row); });
    return out;
  }
  // mergeRowsByCode: per-row, per-field three-way merge keyed on `code`
  // (consulting/coaching/attendance). Rows present only in one side are kept.
  function mergeRowsByCode(remoteRows, localRows, loadedRows) {
    var r = Array.isArray(remoteRows) ? remoteRows : [];
    var l = Array.isArray(localRows)  ? localRows  : [];
    if (!r.length) return l;
    if (!l.length) return r;
    var localByCode = {};
    l.forEach(function(row){ if (row && row.code) localByCode[row.code] = row; });
    var loadedByCode = {};
    (Array.isArray(loadedRows) ? loadedRows : []).forEach(function(row){ if (row && row.code) loadedByCode[row.code] = row; });
    var out = r.map(function(remoteRow){
      if (!remoteRow || !remoteRow.code) return remoteRow;
      var localRow = localByCode[remoteRow.code];
      if (!localRow) return remoteRow;
      var loadedRow = loadedByCode[remoteRow.code] || {};
      var merged = Object.assign({}, remoteRow);
      Object.keys(localRow).forEach(function(field){
        if (field === '_rid') return;
        merged[field] = _mergeField(localRow[field], remoteRow[field], loadedRow[field]);
      });
      return merged;
    });
    // Append local-only rows.
    var remoteCodes = {};
    out.forEach(function(row){ if (row && row.code) remoteCodes[row.code] = 1; });
    l.forEach(function(row){ if (row && row.code && !remoteCodes[row.code]) out.push(row); });
    return out;
  }
  // mergeRowsByIndex: for fixed-length arrays like baseline/endline (9 domains).
  // Three-way merge per field so a cleared score can be blanked.
  function mergeRowsByIndex(remoteRows, localRows, loadedRows) {
    var r  = Array.isArray(remoteRows) ? remoteRows : [];
    var l  = Array.isArray(localRows)  ? localRows  : [];
    var ld = Array.isArray(loadedRows) ? loadedRows : [];
    var len = Math.max(r.length, l.length);
    var out = [];
    for (var i = 0; i < len; i++) {
      var rRow  = r[i]  || {};
      var lRow  = l[i]  || {};
      var ldRow = ld[i] || {};
      var merged = Object.assign({}, rRow);
      Object.keys(lRow).forEach(function(field){
        merged[field] = _mergeField(lRow[field], rRow[field], ldRow[field]);
      });
      out.push(merged);
    }
    return out;
  }
  // unionNotes: keep all notes from both sides, de-duped by (type+date+text).
  function unionNotes(remoteNotes, localNotes) {
    var r = Array.isArray(remoteNotes) ? remoteNotes : [];
    var l = Array.isArray(localNotes)  ? localNotes  : [];
    var seen = {};
    var out = [];
    function key(n) { return (n.type||'') + '|' + (n.date||'') + '|' + (n.text||''); }
    r.concat(l).forEach(function(n){
      if (!n) return;
      var k = key(n);
      if (seen[k]) return;
      seen[k] = 1; out.push(n);
    });
    return out;
  }

  function deleteOrg(org, callback) {
    if (!_online || !authToken || !org.code || !_initialLoadComplete) {
      if (callback) callback(false);
      return;
    }
    request('POST', null, { action: 'remove', code: org.code, password: authToken })
      .then(function(){ if (callback) callback(true); })
      .catch(function(err){
        console.warn('Airtable delete failed:', err.message);
        if (callback) callback(false);
      });
  }

  function migrateFromCache(callback) {
    if (!_initialLoadComplete) {
      alert('Cannot migrate yet — wait for initial sync to complete.');
      if (callback) callback(0);
      return;
    }
    var data = cacheGet();
    if (!data.orgs || !data.orgs.length) { if (callback) callback(0); return; }

    var pushable = data.orgs.filter(isOrgSafeToPush);
    if (!pushable.length) {
      alert('No organisations with substantive data to migrate.');
      if (callback) callback(0);
      return;
    }
    if (!confirm('Push ' + pushable.length + ' organisations to Airtable?')) {
      if (callback) callback(0);
      return;
    }

    setStatus('Migrating ' + pushable.length + ' orgs…', 'info');
    var pending = pushable.length, done = 0;
    pushable.forEach(function(org){
      pushOrg(org, function(ok){
        if (ok) done++;
        pending--;
        if (pending === 0) {
          setStatus('Migration complete (' + done + ' orgs)', 'ok');
          if (callback) callback(done);
        }
      });
    });
  }

  // FIX: actively drain locally-stranded edits — don't wait for the user's
  // next keystroke. Flush when the browser reports it is back online, when the
  // tab regains visibility, and on a slow periodic sweep as a backstop. Also
  // re-assert the pending banner on load so stranded edits are never invisible.
  function _attemptFlush() { if (_initialLoadComplete && authToken && _online) _flushDirty(); }
  if (typeof window !== 'undefined') {
    window.addEventListener('online', _attemptFlush);
    window.addEventListener('focus', _attemptFlush);
    window.addEventListener('load', _pendingBanner);
    window.addEventListener('pagehide', _attemptFlush);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', function(){ if (!document.hidden) _attemptFlush(); });
    }
    setInterval(_attemptFlush, 60000);
  }

  function setAuth(token) { authToken = token; }
  function isOnline() { return _online; }
  function isReady() { return _initialLoadComplete; }

  return {
    loadData: loadData, loadDataSync: loadDataSync, saveData: saveData,
    pushOrg: pushOrg, deleteOrg: deleteOrg, migrateFromCache: migrateFromCache,
    setAuth: setAuth, isOnline: isOnline, isReady: isReady, setStatus: setStatus
  };
})();
