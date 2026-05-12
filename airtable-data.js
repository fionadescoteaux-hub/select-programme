// ═══════════════════════════════════════════════════════════════
// SELECT Programme — Airtable Data Layer
// Version: 2026-05-12-v3 (robust persistence: dual-cache, save queue,
//   corruption-safe load, last-saved stamp, private-mode warning)
// ═══════════════════════════════════════════════════════════════

var AT = (function() {
  'use strict';

  var API        = '/api/airtable';
  var CACHE_KEY  = 'select_tracker_v4';      // primary localStorage key
  var BACKUP_KEY = 'select_tracker_v4_bak';  // redundant backup key
  var SYNC_KEY   = 'select_sync_ts';
  var STAMP_KEY  = 'select_save_stamp';      // ISO timestamp of last successful save
  var authToken  = '';
  var _online    = true;
  var _statusEl  = null;

  // ── Private-mode / quota guard ──────────────────────────────
  var _storageOk = (function() {
    try {
      localStorage.setItem('_st', '1');
      localStorage.removeItem('_st');
      return true;
    } catch(e) { return false; }
  })();

  if (!_storageOk) {
    setTimeout(function() {
      alert('⚠️ Warning: your browser is blocking local storage (private/incognito mode or strict privacy settings). Data cannot be saved to this device. Switch to a normal browser window and use Export to back up your data.');
    }, 800);
  }

  // ── Status bar helper ────────────────────────────────────────
  function setStatus(msg, type) {
    if (!_statusEl) _statusEl = document.getElementById('syncStatus');
    if (_statusEl) {
      _statusEl.textContent = msg;
      _statusEl.className = 'sync-status sync-' + (type || 'info');
      _statusEl.style.display = msg ? 'block' : 'none';
    }
    if (type === 'ok' && msg && msg.indexOf('Saved') > -1) {
      _updateStamp();
    }
  }

  function _updateStamp() {
    var el = document.getElementById('saveStamp');
    if (!el) return;
    var iso = localStorage.getItem(STAMP_KEY);
    if (iso) {
      var d = new Date(iso);
      el.textContent = 'Last saved: ' +
        d.toLocaleDateString('en-IE', {day:'numeric',month:'short',year:'numeric'}) +
        ' at ' + d.toLocaleTimeString('en-IE', {hour:'2-digit',minute:'2-digit'});
    }
  }

  // ── Local cache: dual-write with corruption recovery ─────────
  function cacheGet() {
    // Try primary
    try {
      var d = localStorage.getItem(CACHE_KEY);
      if (d) {
        var parsed = JSON.parse(d);
        if (parsed && Array.isArray(parsed.orgs)) return parsed;
      }
    } catch(e) { console.warn('Primary cache corrupt, trying backup:', e); }

    // Try backup
    try {
      var b = localStorage.getItem(BACKUP_KEY);
      if (b) {
        var parsed2 = JSON.parse(b);
        if (parsed2 && Array.isArray(parsed2.orgs)) {
          console.warn('Restored from backup cache');
          try { localStorage.setItem(CACHE_KEY, b); } catch(e2) {}
          return parsed2;
        }
      }
    } catch(e3) { console.warn('Backup cache also corrupt:', e3); }

    return { orgs: [] };
  }

  function cacheSet(data) {
    if (!_storageOk) return;
    try {
      var str = JSON.stringify(data);
      localStorage.setItem(CACHE_KEY, str);   // primary
      localStorage.setItem(BACKUP_KEY, str);  // redundant copy
      var now = new Date().toISOString();
      localStorage.setItem(SYNC_KEY, now);
      localStorage.setItem(STAMP_KEY, now);
      _updateStamp();
    } catch(e) {
      // Quota exceeded — drop backup and retry primary only
      try {
        localStorage.removeItem(BACKUP_KEY);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        console.warn('Storage quota tight: backup dropped, primary saved');
      } catch(e2) {
        console.error('Storage save failed completely:', e2);
        setStatus('⚠ Local save failed — use Export to back up your data', 'err');
      }
    }
  }

  // ── Pending save queue ───────────────────────────────────────
  // Saves that arrive before authToken is set are queued and
  // flushed automatically once setAuth() is called.
  var _pendingPush = [];

  function _flushPending() {
    if (!_pendingPush.length || !authToken || !_online) return;
    var queue = _pendingPush.slice();
    _pendingPush = [];
    queue.forEach(function(org) { pushOrg(org); });
  }

  // ── HTTP helper ──────────────────────────────────────────────
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
      headers: { 'Content-Type': 'application/json', 'X-Auth': authToken }
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

  // ═══════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════

  // Load all orgs from Airtable (or cache if offline)
  function loadData(callback) {
    setStatus('Syncing…', 'info');

    request('POST', null, { action: 'list' })
      .then(function(data) {
        _online = true;

        if (data.orgs) {
          // Merge: protect any locally-cached edits that haven't yet pushed
          var cached = cacheGet();
          var cacheMap = {};
          (cached.orgs || []).forEach(function(o) { cacheMap[o.code] = o; });

          data.orgs.forEach(function(o) {
            // Ensure backward-compatible structure
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

            // If cache has richer data for this org, keep it for array fields
            // that Airtable may return empty when a push hasn't completed yet
            var co = cacheMap[o.code];
            if (co) {
              if ((co.notes       || []).length > (o.notes       || []).length) o.notes       = co.notes;
              if ((co.consulting  || []).length > 0 && (o.consulting  || []).length === 0) o.consulting  = co.consulting;
              if ((co.coaching    || []).length > 0 && (o.coaching    || []).length === 0) o.coaching    = co.coaching;
              if ((co.attendance  || []).length > 0 && (o.attendance  || []).length === 0) o.attendance  = co.attendance;
            }
          });
        }

        cacheSet(data);
        setStatus('Synced ✓', 'ok');
        setTimeout(function() { setStatus('', 'ok'); }, 3000);
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
    // Cache write is ALWAYS first and unconditional
    cacheSet(data);

    var org = null;
    if (changedOrgCode) {
      for (var i = 0; i < data.orgs.length; i++) {
        if (data.orgs[i].code === changedOrgCode) { org = data.orgs[i]; break; }
      }
    }

    // If auth not ready, queue the push — data is already safe in cache
    if (!authToken) {
      if (org) {
        _pendingPush.push(org);
        setStatus('Saved locally (will sync on login)', 'warn');
      }
      return;
    }

    if (!_online) {
      setStatus('Saved locally (offline)', 'warn');
      return;
    }

    if (org) pushOrg(org);
  }

  // Push a single org to Airtable (create or update)
  function pushOrg(org, callback) {
    if (!authToken) {
      _pendingPush.push(org);
      return;
    }
    if (!_online) {
      if (callback) callback(false);
      return;
    }

    setStatus('Saving…', 'info');

    var isNew = !org._rid;
    var payload;

    if (isNew) {
      payload = {
        action:       'create',
        password:     authToken,
        name:         org.name         || '',
        ceo:          org.ceo          || '',
        code:         org.code         || '',
        jurisdiction: (org.kpi && org.kpi.jurisdiction) || 'ROI'
      };
    } else {
      payload = {
        action:         'update',
        password:       authToken,
        code:           org.code,
        kpi:            org.kpi            || {},
        app:            org.app            || {},
        diagnosis:      org.diagnosis      || {},
        crossBorder:    org.crossBorder    || {},
        financial:      org.financial      || {},
        baseline:       org.baseline       || [],
        endline:        org.endline        || [],
        smart:          org.smart          || [],
        consulting:     org.consulting     || [],
        coaching:       org.coaching       || [],
        attendance:     org.attendance     || [],
        progress:       org.progress       || [],
        notes:          org.notes          || [],
        baselineLocked: org.baselineLocked || false,
        intensity:      org.intensity      || '',
        baselineNotes:  org.baselineNotes  || '',
        assessor:       org.assessor       || {}
      };
    }

    request('POST', null, payload)
      .then(function(res) {
        _online = true;
        setStatus('Saved ✓', 'ok');
        setTimeout(function() { setStatus('', 'ok'); }, 2000);
        if (callback) callback(true);
      })
      .catch(function(err) {
        console.warn('Airtable save failed:', err.message);
        setStatus('Airtable save failed — data kept locally', 'warn');
        _online = false;
        if (callback) callback(false);
      });
  }

  // Delete an org from Airtable
  function deleteOrg(org, callback) {
    if (!_online || !authToken || !org.code) {
      if (callback) callback(false);
      return;
    }
    request('POST', null, { action: 'remove', code: org.code, password: authToken })
      .then(function() { if (callback) callback(true); })
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

  // Set the auth token (called after login) — also flushes any pending saves
  function setAuth(token) {
    authToken = token;
    setTimeout(_flushPending, 500);
  }

  function isOnline() { return _online; }

  // ── Return public API ────────────────────────────────────────
  return {
    loadData:         loadData,
    loadDataSync:     loadDataSync,
    saveData:         saveData,
    pushOrg:          pushOrg,
    deleteOrg:        deleteOrg,
    migrateFromCache: migrateFromCache,
    setAuth:          setAuth,
    isOnline:         isOnline,
    setStatus:        setStatus
  };
})();
