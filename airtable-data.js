// ═══════════════════════════════════════════════════════════════
// SELECT Programme — Airtable Data Layer
// Version: 2026-05-20-MULTIUSER-MERGE
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
// ═══════════════════════════════════════════════════════════════

var AT = (function() {
  'use strict';

  var API        = '/api/airtable';
  var CACHE_KEY  = 'select_tracker_v4';
  var BACKUP_KEY = 'select_tracker_v4_bak';
  var SYNC_KEY   = 'select_sync_ts';
  var STAMP_KEY  = 'select_save_stamp';

  var authToken            = '';
  var _online              = true;
  var _statusEl            = null;
  var _initialLoadComplete = false;  // THE KEY GUARD
  var _pendingPush         = [];

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
        if (c && (c.consultedBy || c.actionsAgreed || c.keyOutputs || c.hours || c.completed)) return true;
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
            if (typeof o.baselineNotes !== 'string') o.baselineNotes = '';
            if (typeof o.baselineReportUrl !== 'string') o.baselineReportUrl = '';

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

              // SMART: array index based — if cache has more entries or any cache entry
              // has more data than Airtable's, prefer cache wholesale
              if ((co.smart || []).length > (o.smart || []).length) o.smart = co.smart;
              else if (Array.isArray(co.smart) && co.smart.length > 0) {
                var cacheHasMore = false;
                for (var si = 0; si < co.smart.length; si++) {
                  var cs = co.smart[si], as = o.smart[si];
                  if (cs && cs.objective && (!as || !as.objective)) { cacheHasMore = true; break; }
                }
                if (cacheHasMore) o.smart = co.smart;
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
            }
          });
        }

        // _rid values are KEPT in cache so client knows which records exist.
        // (Earlier versions stripped these "for safety" but doing so caused
        // every push to look like a new-org create, generating duplicates.)

        cacheSet(data);
        _initialLoadComplete = true;  // unlock pushes
        setStatus('Synced ✓', 'ok');
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

  function saveData(data, changedOrgCode) {
    // Cache is always safe to write
    cacheSet(data);

    if (!changedOrgCode) return;
    var org = null;
    for (var i = 0; i < data.orgs.length; i++) {
      if (data.orgs[i].code === changedOrgCode) { org = data.orgs[i]; break; }
    }
    if (!org) return;

    // SAFETY GATES - all four must pass before pushing to Airtable
    if (!_initialLoadComplete) { setStatus('Saved locally (waiting for sync)', 'warn'); return; }
    if (!authToken)            { setStatus('Saved locally', 'warn'); return; }
    if (!_online)              { setStatus('Saved locally (offline)', 'warn'); return; }
    if (!isOrgSafeToPush(org)) {
      console.warn('[AT] Skipping push of empty org:', org.code);
      setStatus('Saved locally', 'warn');
      return;
    }

    pushOrg(org);
  }

  function pushOrg(org, callback) {
    if (!_initialLoadComplete) { if (callback) callback(false); return; }
    if (!authToken || !_online) { if (callback) callback(false); return; }
    if (!isOrgSafeToPush(org)) {
      console.warn('[AT] pushOrg blocked - empty org:', org.code);
      if (callback) callback(false);
      return;
    }

    // KEEP _rid values intact — they tell the server we're updating, not creating.
    // (Stripping them was the cause of the duplicate cascade.)

    setStatus('Saving…', 'info');
    var isNew = !org._rid;

    if (isNew) {
      var newPayload = {
        action: 'create', password: authToken,
        name: org.name || '', ceo: org.ceo || '', code: org.code || '',
        jurisdiction: (org.kpi && org.kpi.jurisdiction) || 'ROI'
      };
      request('POST', null, newPayload)
        .then(function(){
          _online = true;
          setStatus('Saved ✓', 'ok');
          setTimeout(function(){ setStatus('', 'ok'); }, 2000);
          if (callback) callback(true);
        })
        .catch(function(err){
          console.warn('Airtable create failed:', err.message);
          setStatus('Save failed — kept locally', 'warn');
          _online = false;
          if (callback) callback(false);
        });
      return;
    }

    // READ-MERGE-WRITE for updates:
    // Before pushing, fetch the current Airtable state for THIS org so we can
    // merge our local change into the latest shared record rather than
    // overwriting the other assessor's saved edits with our stale full blob.
    // Per-row arrays (consulting/coaching/attendance) merge by code at the
    // field level. Simple/scalar fields use a "local wins if non-empty" rule
    // — this is correct here because we KNOW the local copy was just edited
    // by this user, so non-empty local values are intentional changes.
    request('POST', null, { action: 'list' })
      .then(function(latest){
        var latestOrg = null;
        if (latest && Array.isArray(latest.orgs)) {
          for (var i = 0; i < latest.orgs.length; i++) {
            if (latest.orgs[i].code === org.code) { latestOrg = latest.orgs[i]; break; }
          }
        }

        // Build the payload starting from the latest Airtable state, then
        // overlay the local edits for this org.
        var basis = latestOrg ? latestOrg : org;
        var merged = {
          kpi:          mergeObj(basis.kpi, org.kpi),
          app:          mergeObj(basis.app, org.app),
          diagnosis:    mergeObj(basis.diagnosis, org.diagnosis),
          crossBorder:  mergeObj(basis.crossBorder, org.crossBorder),
          financial:    mergeObj(basis.financial, org.financial),
          assessor:     mergeObj(basis.assessor, org.assessor),
          baseline:     mergeRowsByIndex(basis.baseline, org.baseline),
          endline:      mergeRowsByIndex(basis.endline, org.endline),
          smart:        org.smart && org.smart.length ? org.smart : (basis.smart || []),
          notes:        unionNotes(basis.notes, org.notes),
          consulting:   mergeRowsByCode(basis.consulting, org.consulting),
          coaching:     mergeRowsByCode(basis.coaching,   org.coaching),
          attendance:   mergeRowsByCode(basis.attendance, org.attendance),
          progress:     org.progress || basis.progress || [],
          baselineLocked: !!(org.baselineLocked || basis.baselineLocked),
          intensity:      org.intensity || basis.intensity || '',
          baselineNotes:  org.baselineNotes || basis.baselineNotes || '',
          baselineReportUrl: org.baselineReportUrl || basis.baselineReportUrl || ''
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
          assessor: merged.assessor
        };

        return request('POST', null, payload);
      })
      .then(function(){
        _online = true;
        setStatus('Saved ✓', 'ok');
        setTimeout(function(){ setStatus('', 'ok'); }, 2000);
        if (callback) callback(true);
      })
      .catch(function(err){
        console.warn('Airtable save failed:', err.message);
        setStatus('Save failed — kept locally', 'warn');
        _online = false;
        if (callback) callback(false);
      });
  }

  // ── Merge helpers used by read-merge-write pushOrg ──
  // mergeObj: local non-empty fields win over remote; remote fills the rest.
  function mergeObj(remote, local) {
    var r = remote && typeof remote === 'object' ? remote : {};
    var l = local  && typeof local  === 'object' ? local  : {};
    var out = {};
    Object.keys(r).forEach(function(k){ out[k] = r[k]; });
    Object.keys(l).forEach(function(k){
      var v = l[k];
      // Local wins for any non-empty value, including `false` (saved boolean).
      if (v !== '' && v !== null && v !== undefined) out[k] = v;
      else if (!(k in out)) out[k] = v;
    });
    return out;
  }
  // mergeRowsByCode: per-row, per-field merge keyed on `code` (consulting/coaching/attendance).
  // Local non-empty field values overlay remote. Rows present only in one side are kept.
  function mergeRowsByCode(remoteRows, localRows) {
    var r = Array.isArray(remoteRows) ? remoteRows : [];
    var l = Array.isArray(localRows)  ? localRows  : [];
    if (!r.length) return l;
    if (!l.length) return r;
    var localByCode = {};
    l.forEach(function(row){ if (row && row.code) localByCode[row.code] = row; });
    var out = r.map(function(remoteRow){
      if (!remoteRow || !remoteRow.code) return remoteRow;
      var localRow = localByCode[remoteRow.code];
      if (!localRow) return remoteRow;
      var merged = Object.assign({}, remoteRow);
      Object.keys(localRow).forEach(function(field){
        if (field === '_rid') return;
        var v = localRow[field];
        // Local wins for non-empty values. For booleans, only `true` overrides
        // remote (a local `false` could be stale; if user genuinely unticked,
        // they'll save again and remote will already be `false` next read).
        if (typeof v === 'boolean') {
          if (v === true) merged[field] = true;
        } else if (v !== '' && v !== null && v !== undefined) {
          merged[field] = v;
        }
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
  // Local field value wins where non-empty.
  function mergeRowsByIndex(remoteRows, localRows) {
    var r = Array.isArray(remoteRows) ? remoteRows : [];
    var l = Array.isArray(localRows)  ? localRows  : [];
    var len = Math.max(r.length, l.length);
    var out = [];
    for (var i = 0; i < len; i++) {
      var rRow = r[i] || {};
      var lRow = l[i] || {};
      var merged = Object.assign({}, rRow);
      Object.keys(lRow).forEach(function(field){
        var v = lRow[field];
        if (v !== '' && v !== null && v !== undefined) merged[field] = v;
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

  function setAuth(token) { authToken = token; }
  function isOnline() { return _online; }
  function isReady() { return _initialLoadComplete; }

  return {
    loadData: loadData, loadDataSync: loadDataSync, saveData: saveData,
    pushOrg: pushOrg, deleteOrg: deleteOrg, migrateFromCache: migrateFromCache,
    setAuth: setAuth, isOnline: isOnline, isReady: isReady, setStatus: setStatus
  };
})();
