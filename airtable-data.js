// ═══════════════════════════════════════════════════════════════
// SELECT Programme — Airtable Data Layer
// Version: 2026-05-12-SAFE
//
// CRITICAL SAFETY RULES (prevent Airtable wipes):
// 1. NEVER push to Airtable until loadData() succeeds at least once.
// 2. NEVER push an org that fails isOrgSafeToPush() — must have real data.
// 3. Cache writes are always allowed and unconditional (local data is safe).
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

            // CACHE PROTECTS LOCAL EDITS: if cache has data Airtable returned empty, keep cache
            var co = cacheMap[o.code];
            if (co) {
              if ((co.notes      || []).length > (o.notes      || []).length) o.notes      = co.notes;
              if ((co.consulting || []).length > 0 && (o.consulting || []).length === 0) o.consulting = co.consulting;
              if ((co.coaching   || []).length > 0 && (o.coaching   || []).length === 0) o.coaching   = co.coaching;
              if ((co.attendance || []).length > 0 && (o.attendance || []).length === 0) o.attendance = co.attendance;
              if ((co.smart      || []).length > 0 && (o.smart      || []).length === 0) o.smart      = co.smart;
              if (co.diagnosis && co.diagnosis.problemStatement && !(o.diagnosis && o.diagnosis.problemStatement)) o.diagnosis = co.diagnosis;
              if (co.baselineNotes && !o.baselineNotes) o.baselineNotes = co.baselineNotes;
              if (co.intensity && !o.intensity) o.intensity = co.intensity;
              if (co.baselineLocked && !o.baselineLocked) o.baselineLocked = true;
              if (co.financial && Object.keys(co.financial).length > 0 && Object.keys(o.financial || {}).length === 0) o.financial = co.financial;
            }
          });
        }

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

    setStatus('Saving…', 'info');
    var isNew = !org._rid;
    var payload;

    if (isNew) {
      payload = {
        action: 'create', password: authToken,
        name: org.name || '', ceo: org.ceo || '', code: org.code || '',
        jurisdiction: (org.kpi && org.kpi.jurisdiction) || 'ROI'
      };
    } else {
      payload = {
        action: 'update', password: authToken, code: org.code,
        kpi: org.kpi || {}, app: org.app || {}, diagnosis: org.diagnosis || {},
        crossBorder: org.crossBorder || {}, financial: org.financial || {},
        baseline: org.baseline || [], endline: org.endline || [],
        smart: org.smart || [], consulting: org.consulting || [],
        coaching: org.coaching || [], attendance: org.attendance || [],
        progress: org.progress || [], notes: org.notes || [],
        baselineLocked: org.baselineLocked || false,
        intensity: org.intensity || '',
        baselineNotes: org.baselineNotes || '',
        assessor: org.assessor || {}
      };
    }

    request('POST', null, payload)
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
