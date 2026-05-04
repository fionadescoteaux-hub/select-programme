// ═══════════════════════════════════════════════════════════════
// SELECT Programme — Airtable Data Layer
// Shared by assessor.html and tracker.html
// Replaces localStorage with Airtable via Netlify Functions proxy
// Falls back to localStorage if offline or Airtable unavailable
// ═══════════════════════════════════════════════════════════════

var AT = (function() {
  'use strict';

  var API = '/api/airtable';
  var CACHE_KEY = 'select_tracker_v4';      // same key as before — backward compatible
  var SYNC_KEY = 'select_sync_ts';
  var authToken = '';                        // set after login
  var _online = true;                       // assume online until proven otherwise
  var _syncing = false;
  var _syncCallbacks = [];
  var _statusEl = null;                     // optional status indicator element

  // ── Status bar helper ──
  function setStatus(msg, type) {
    if (!_statusEl) {
      _statusEl = document.getElementById('syncStatus');
    }
    if (_statusEl) {
      _statusEl.textContent = msg;
      _statusEl.className = 'sync-status sync-' + (type || 'info');
      _statusEl.style.display = msg ? 'block' : 'none';
    }
  }

  // ── Local cache (backward compatible with existing localStorage format) ──
  function cacheGet() {
    try {
      var d = localStorage.getItem(CACHE_KEY);
      return d ? JSON.parse(d) : { orgs: [] };
    } catch (e) { return { orgs: [] }; }
  }

  function cacheSet(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(SYNC_KEY, new Date().toISOString());
    } catch (e) { /* quota exceeded — acceptable */ }
  }

  // ── HTTP helper ──
  function request(method, params, body) {
    var url = API;
    if (params) {
      var qs = Object.keys(params).map(function(k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      }).join('&');
      if (qs) url += '?' + qs;
    }

    var opts = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Auth': authToken
      }
    };
    if (body) opts.body = JSON.stringify(body);

    return fetch(url, opts).then(function(res) {
      if (!res.ok) {
        return res.text().then(function(t) {
          var err = new Error('API ' + res.status + ': ' + t);
          err.status = res.status;
          throw err;
        });
      }
      return res.json();
    });
  }

  // ═══════════════════════════════════════
  // PUBLIC API — drop-in replacements
  // ═══════════════════════════════════════

  // Load all orgs from Airtable (or cache if offline)
  function loadData(callback) {
    setStatus('Syncing…', 'info');

    request('POST', null, {action:'list'})
      .then(function(data) {
        _online = true;
        // Merge _recordId into each org and cache
        if (data.orgs) {
          data.orgs.forEach(function(o) {
            // Ensure backward-compatible structure
            if (!o.baseline) o.baseline = [];
            if (!o.endline) o.endline = [];
            if (!o.smart) o.smart = [];
            if (!o.notes) o.notes = [];
            if (!o.consulting) o.consulting = [];
            if (!o.coaching) o.coaching = [];
            if (!o.kpi) o.kpi = {};
            if (!o.app) o.app = {};
            if (!o.assessor) o.assessor = {};
            if (!o.diagnosis) o.diagnosis = {};
            if (!o.sop) o.sop = {};
            if (!o.crossBorder) o.crossBorder = {};
          });
        }
        cacheSet(data);
        setStatus('Synced ✓', 'ok');
        setTimeout(function() { setStatus('', 'ok'); }, 2000);
        if (callback) callback(data);
      })
      .catch(function(err) {
        console.warn('Airtable fetch failed, using cache:', err.message);
        _online = false;
        setStatus('Offline — using cached data', 'warn');
        var cached = cacheGet();
        if (callback) callback(cached);
      });
  }

  // Synchronous cache read (for code that can't be async yet)
  function loadDataSync() {
    return cacheGet();
  }

  // Save entire dataset to cache (immediate) + push changed org to Airtable
  function saveData(data, changedOrgCode) {
    cacheSet(data);

    if (!_online || !authToken) return;

    // If a specific org changed, push just that one
    if (changedOrgCode) {
      var org = null;
      for (var i = 0; i < data.orgs.length; i++) {
        if (data.orgs[i].code === changedOrgCode) { org = data.orgs[i]; break; }
      }
      if (org) pushOrg(org);
    }
  }

  // Push a single org to Airtable (create or update)
  function pushOrg(org, callback) {
    if (!_online || !authToken) {
      if (callback) callback(false);
      return;
    }

    setStatus('Saving...', 'info');

    var isNew = !org._rid;
    var payload;

    if (isNew) {
      // New org: create action with flat fields
      payload = {
        action: 'create',
        name: org.name || '',
        ceo: org.ceo || '',
        code: org.code || '',
        jurisdiction: (org.kpi && org.kpi.jurisdiction) || 'ROI'
      };
    } else {
      // Existing org: update action with all data
      payload = {
        action: 'update',
        code: org.code,
        kpi: org.kpi || {},
        diagnosis: org.diagnosis || {},
        crossBorder: org.crossBorder || {},
        baseline: org.baseline || [],
        endline: org.endline || [],
        smart: org.smart || [],
        consulting: org.consulting || [],
        coaching: org.coaching || [],
        checklist: org.checklist || [],
        validation: org.validation || [],
        progress: org.progress || [],
        notes: org.notes || [],
        baselineLocked: org.baselineLocked || false,
        intensity: org.intensity || '',
        assessor: org.assessor || ''
      };
    }

    request('POST', null, payload)
      .then(function(res) {
        setStatus('Saved', 'ok');
        setTimeout(function() { setStatus('', 'ok'); }, 2000);
        if (callback) callback(true);
      })
      .catch(function(err) {
        console.warn('Airtable save failed:', err.message);
        setStatus('Save failed -- cached locally', 'warn');
        if (callback) callback(false);
      });
  }


  // Delete an org from Airtable
  function deleteOrg(org, callback) {
    if (!_online || !authToken || !org.code) {
      if (callback) callback(false);
      return;
    }

    request('POST', null, {action:'remove', code:org.code})
      .then(function() {
        if (callback) callback(true);
      })
      .catch(function(err) {
        console.warn('Airtable delete failed:', err.message);
        if (callback) callback(false);
      });
  }

  // Bulk push all orgs from localStorage to Airtable (migration helper)
  function migrateFromCache(callback) {
    var data = cacheGet();
    if (!data.orgs || !data.orgs.length) {
      if (callback) callback(0);
      return;
    }

    setStatus('Migrating ' + data.orgs.length + ' orgs to Airtable…', 'info');
    var pending = data.orgs.length;
    var done = 0;

    data.orgs.forEach(function(org) {
      if (org._recordId) {
        // Already has an Airtable record — skip
        pending--;
        done++;
        if (pending === 0) {
          setStatus('Migration complete (' + done + ' orgs)', 'ok');
          if (callback) callback(done);
        }
        return;
      }

      pushOrg(org, function(ok) {
        if (ok) done++;
        pending--;
        if (pending === 0) {
          cacheSet(data);
          setStatus('Migration complete (' + done + ' orgs)', 'ok');
          if (callback) callback(done);
        }
      });
    });
  }

  // Set the auth token (called after login)
  function setAuth(token) {
    authToken = token;
  }

  function isOnline() { return _online; }

  // ── Return public API ──
  return {
    loadData: loadData,
    loadDataSync: loadDataSync,
    saveData: saveData,
    pushOrg: pushOrg,
    deleteOrg: deleteOrg,
    migrateFromCache: migrateFromCache,
    setAuth: setAuth,
    isOnline: isOnline,
    setStatus: setStatus
  };
})();
