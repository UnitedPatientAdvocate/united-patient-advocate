(function(){
  'use strict';

  var INTAKE_KEY = 'upa.intake.v1';
  var CHECKOUT_KEY = 'upa.checkout.session.v2';
  var PAID_KEY = 'upa.paid.results.v2';
  var REVIEW_KEY = 'upa.review.session.v1';
  var CASE_KEY = 'upa.case.snapshot.v1';
  var DASHBOARD_KEY = 'upa.dashboard.state.v1';
  var TOKEN_KEY = 'upa.case.handoff.token.v1';
  var ACTIVE_KEY = 'upa.active.case.v1';
  var SCAN_KEY = 'upa.scan.v1';
  var TOKEN_PARAM = 'case';
  var MAX_TOKEN_LENGTH = 6000;
  var MAX_CASE_PARAM_LENGTH = 1200;
  var MAX_CHECKOUT_URL_LENGTH = 1800;

  function now(){
    return new Date().toISOString();
  }

  function readJSON(key){
    var raw = '';
    try{ raw = sessionStorage.getItem(key) || ''; }catch(e){}
    if(!raw){
      try{ raw = localStorage.getItem(key) || ''; }catch(e){}
    }
    if(!raw) return null;
    try{ return JSON.parse(raw); }catch(e){ return null; }
  }

  function writeJSON(key, value){
    var raw;
    try{ raw = JSON.stringify(value || {}); }catch(e){ return false; }
    try{ sessionStorage.setItem(key, raw); }catch(e){}
    try{ localStorage.setItem(key, raw); }catch(e){}
    return true;
  }

  function removeJSON(key){
    try{ sessionStorage.removeItem(key); }catch(e){}
    try{ localStorage.removeItem(key); }catch(e){}
  }

  function clean(value){
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function hasIntake(value){
    if(!value || typeof value !== 'object') return false;
    // Scan-originated sessions: _scan flag + at least one meaningful field
    if(value._scan && (clean(value.provider || value.providerName) || clean(value.bill_amount || value.totalBilled || value.patientBalance))) return true;
    return !!(clean(value.name || value.patient_name || value.patientName) ||
      clean(value.provider || value.providerName) ||
      clean(value.bill_amount || value.balance || value.totalBilled) ||
      clean(value.concerns || value.specificConcerns || value.description));
  }

  function clone(value){
    try{ return JSON.parse(JSON.stringify(value || {})); }catch(e){ return {}; }
  }

  function timeValue(value){
    if(!value || typeof value !== 'object') return 0;
    var raw = value._upa_active_at || value.updatedAt || value.paidAt || value.checkoutStartedAt || value.caseGeneratedAt || value.submitted_at || value.createdAt || value.savedAt || value._scan_ts || value._scanTimestamp || '';
    if(typeof raw === 'number') return raw;
    var parsed = Date.parse(raw);
    return isNaN(parsed) ? 0 : parsed;
  }

  function caseIdFromIntake(intake){
    if(!intake || typeof intake !== 'object') return '';
    return clean(intake._upa_case_id || intake.active_case_id || intake.caseId || intake.sessionId || '');
  }

  function simpleCaseId(intake, prefix){
    var base = [
      prefix || 'case',
      intake && (intake._scan_ts || intake._scanTimestamp || intake.submitted_at || intake._upa_active_at) || now(),
      intake && (intake.provider || intake.providerName || '') || '',
      intake && (intake.account_number || intake.accountNumber || intake._claim_number || '') || '',
      intake && (intake.bill_amount || intake.balance || intake.totalBilled || '') || ''
    ].join('|');
    var hash = 0;
    for(var i = 0; i < base.length; i++) hash = ((hash << 5) - hash + base.charCodeAt(i)) | 0;
    return 'upa-' + (prefix || 'case') + '-' + Math.abs(hash).toString(36);
  }

  function ensureActiveFields(intake, meta){
    var out = clone(intake);
    var ts = out._upa_active_at || (meta && meta.activeAt) || now();
    out._upa_active_at = ts;
    out._upa_source = out._upa_source || (meta && meta.source) || 'UPA';
    out._upa_case_id = caseIdFromIntake(out) || simpleCaseId(out, out._scan ? 'scan' : 'intake');
    out.active_case_id = out._upa_case_id;
    return out;
  }

  function normalizeScanIntake(scan){
    if(!scan || typeof scan !== 'object') return {};
    if(!(scan.provider || scan.totalBilled != null || scan.patientBalance != null || scan.claimNumber || scan.serviceDate || scan.insuranceName)) return {};
    var scanAmt = scan.patientBalance != null ? scan.patientBalance : (scan.totalBilled != null ? scan.totalBilled : null);
    var fmtAmt = scanAmt != null ? ('$' + Number(scanAmt).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})) : '';
    var ts = scan._upa_active_at || scan._scanTimestamp || now();
    var intake = {
      _scan:true,
      _upa_case_id:scan._upa_case_id || simpleCaseId({_scan:true,_scan_ts:ts,provider:scan.provider,_claim_number:scan.claimNumber,bill_amount:fmtAmt}, 'scan'),
      _upa_active_at:ts,
      _upa_source:'scan',
      provider:scan.provider || '',
      extracted_provider:scan.provider || '',
      extracted_provider_confidence:scan.provider ? 0.75 : 0,
      bill_amount:fmtAmt,
      bill_amount_other:fmtAmt,
      extracted_bill_amount:scanAmt != null ? String(scanAmt) : '',
      extracted_bill_amount_confidence:scanAmt != null ? 0.9 : 0,
      date_of_service:scan.serviceDateRaw || scan.serviceDate || '',
      extracted_date_of_service:scan.serviceDateRaw || scan.serviceDate || '',
      extracted_date_confidence:scan.serviceDate ? 0.75 : 0,
      insurance:scan.insuranceName || '',
      extracted_insurance:scan.insuranceName || '',
      account_number:scan.claimNumber || '',
      extracted_account_number:scan.claimNumber || '',
      extracted_account_confidence:scan.claimNumber ? 0.74 : 0,
      _patient_balance:scan.patientBalance,
      _total_billed:scan.totalBilled,
      _claim_number:scan.claimNumber || '',
      _confidence:scan.confidence || '',
      _denial:!!scan.denialDetected,
      _has_duplicates:!!scan.hasDuplicateCodes,
      _cpt_codes:scan.cptCodes || [],
      _page_count:scan.pageCount || 1,
      _scan_ts:scan._scanTimestamp || ts
    };
    intake.active_case_id = intake._upa_case_id;
    return intake;
  }

  function addIntakeCandidate(list, intake, container, source){
    if(!hasIntake(intake)) return;
    list.push({
      intake:intake,
      source:source || '',
      time:Math.max(timeValue(intake), timeValue(container || {})),
      caseId:caseIdFromIntake(intake) || caseIdFromIntake(container || {})
    });
  }

  function newestIntakeCandidate(){
    // ACTIVE_KEY is the explicitly managed "current case" slot.
    // writeScanStateToStorage() and activateIntake() are the ONLY writers.
    //
    // C3 FIX: trust scan-sourced ACTIVE_KEY unconditionally — even during the
    // provisional window when provider/amount are still empty and hasIntake() would
    // return false. The presence of _upa_active_at (stamped by writeScanStateToStorage)
    // is the authoritative signal that a new scan session has started. Without this,
    // a provisional that fails hasIntake() falls through to the timestamp list, where
    // old PAID_KEY or CHECKOUT_KEY data wins (they have newer updatedAt from markPaid).
    var active = activeEnvelope();
    if(active && active.intake){
      var activeIsScanned = !!(active.source === 'scan' || active.intake._scan || active.intake._upa_source === 'scan');
      if(activeIsScanned && active.intake._upa_active_at){
        // Trust this slot. Return it regardless of hasIntake() result.
        // Downstream callers (getIntake → activateIntake) will handle empty-field provisionals gracefully.
        return { intake:active.intake, source:'active', time:timeValue(active), caseId:active.caseId || caseIdFromIntake(active.intake) };
      }
      // Non-provisional scan with all required fields — standard hasIntake check
      if(activeIsScanned && hasIntake(active.intake)){
        return { intake:active.intake, source:'active', time:timeValue(active), caseId:active.caseId || caseIdFromIntake(active.intake) };
      }
    }
    // For non-scan cases with a properly stamped caseId: trust ACTIVE_KEY
    // unconditionally, just as scan cases are trusted above.
    //
    // Rationale: every write path that establishes a new intake session
    // (persistIntake, markCheckout, importCaseToken, markPaid) explicitly updates
    // ACTIVE_KEY with the current intake. Old data left in CHECKOUT_KEY, REVIEW_KEY,
    // or PAID_KEY from a previous session can have a newer `updatedAt` timestamp
    // than the freshly-written ACTIVE_KEY (because restoreSession() re-stamps those
    // keys on every page load), letting stale data win the timestamp race below.
    // Trusting ACTIVE_KEY when it carries a valid caseId prevents this.
    var activeCaseIdEarly = active && (active.caseId || caseIdFromIntake(active.intake || {})) || '';
    if(activeCaseIdEarly && active && active.intake && hasIntake(active.intake)){
      return { intake:active.intake, source:'active', time:timeValue(active), caseId:activeCaseIdEarly };
    }

    // Fallback timestamp race — used when ACTIVE_KEY has no caseId yet (e.g. legacy
    // data written before caseId stamping was added, or a bare bootstrap envelope).
    var list = [];
    if(active && active.intake) addIntakeCandidate(list, active.intake, active, 'active');
    addIntakeCandidate(list, readJSON(INTAKE_KEY), null, 'intake');
    addIntakeCandidate(list, normalizeScanIntake(readJSON(SCAN_KEY)), readJSON(SCAN_KEY), 'scan');
    var checkout = readJSON(CHECKOUT_KEY);
    if(checkout && checkout.intake) addIntakeCandidate(list, checkout.intake, checkout, 'checkout');
    var review = readJSON(REVIEW_KEY);
    if(review && review.intake) addIntakeCandidate(list, review.intake, review, 'review');
    var paid = readJSON(PAID_KEY);
    if(paid && paid.session && paid.session.intake) addIntakeCandidate(list, paid.session.intake, paid.session, 'paid-session');
    if(paid && paid.intake) addIntakeCandidate(list, paid.intake, paid, 'paid');
    var savedCase = readJSON(CASE_KEY);
    if(savedCase && savedCase.raw){
      // CASE_KEY guard: if an active case exists with a DIFFERENT caseId, the snapshot is stale —
      // suppress it entirely so it cannot win the timestamp race over the current active case.
      // Only include the snapshot when: (a) there is no active case, (b) neither has a caseId to
      // compare, or (c) both caseIds match (same session).
      var activeCaseId = active && (active.caseId || caseIdFromIntake(active.intake || {})) || '';
      var snapshotCaseId = caseIdFromIntake(savedCase.raw) || '';
      if(!activeCaseId || !snapshotCaseId || snapshotCaseId === activeCaseId){
        addIntakeCandidate(list, savedCase.raw, savedCase, 'case');
      } else {
        console.log('[UPA] ⚠ Stale case snapshot suppressed | snapshot:', snapshotCaseId, '| active:', activeCaseId);
      }
    }
    list.sort(function(a,b){ return b.time - a.time; });
    return list[0] || null;
  }

  function activeEnvelope(){
    var active = readJSON(ACTIVE_KEY) || {};
    if(active && !active.intake && hasIntake(active)){
      var prepared = ensureActiveFields(active, { source:active._upa_source || active.source || 'legacy-active', stage:'legacy-active-normalize' });
      var session = {
        version:4,
        sessionId:prepared._upa_case_id,
        activeCaseId:prepared._upa_case_id,
        createdAt:prepared._upa_active_at,
        updatedAt:now(),
        stage:'legacy-active-normalize',
        source:prepared._upa_source || 'legacy-active',
        paid:false,
        intake:clone(prepared)
      };
      active = {
        version:1,
        caseId:prepared._upa_case_id,
        source:session.source,
        updatedAt:session.updatedAt,
        intake:clone(prepared),
        session:clone(session)
      };
      writeJSON(ACTIVE_KEY, active);
      writeJSON(INTAKE_KEY, prepared);
    }
    return active;
  }

  function shouldClearDerivedState(active, prepared, meta, options){
    options = options || {};
    if(options.clearStale === false) return false;
    var stage = meta && meta.stage ? String(meta.stage) : '';
    var newWrite = /^(scan-complete|intake-complete|success-resume|token-intake-restore)$/.test(stage);
    if(options.clearStale === true) return !!(newWrite || (active && active.caseId && active.caseId !== prepared._upa_case_id));
    return !!(newWrite && active && active.caseId && active.caseId !== prepared._upa_case_id);
  }

  function activateIntake(intake, meta, options){
    if(!hasIntake(intake)) return intake || {};
    var active = activeEnvelope();
    var prepared = ensureActiveFields(intake, meta || {});
    var sameCase = !!(active && active.caseId && active.caseId === prepared._upa_case_id);
    var source = prepared._upa_source || (sameCase && active.source) || (meta && meta.source) || 'UPA';
    var preservedPaid = !!(sameCase && (active.paid || (active.session && active.session.paid)));
    if(shouldClearDerivedState(active, prepared, meta || {}, options || {})){
      removeJSON(CASE_KEY);
      removeJSON(DASHBOARD_KEY);
      removeJSON(PAID_KEY);
      removeJSON('upa.paid');
    }
    var session = {
      version:4,
      sessionId:prepared._upa_case_id,
      activeCaseId:prepared._upa_case_id,
      createdAt:prepared._upa_active_at,
      updatedAt:now(),
      stage:(meta && meta.stage) || 'active-case',
      source:source,
      paid:preservedPaid,
      intake:clone(prepared),
      meta:clone(meta || {})
    };
    var envelope = {
      version:1,
      caseId:prepared._upa_case_id,
      source:source,
      updatedAt:session.updatedAt,
      intake:clone(prepared),
      session:clone(session)
    };
    if(preservedPaid) envelope.paid = true;
    if(sameCase && active.scan) envelope.scan = clone(active.scan);
    if(sameCase && active.case) envelope.case = clone(active.case);
    if(sameCase && active.dashboard) envelope.dashboard = clone(active.dashboard);
    writeJSON(ACTIVE_KEY, envelope);
    writeJSON(INTAKE_KEY, prepared);
    return prepared;
  }

  function base64UrlEncode(text){
    try{
      var binary = '';
      if(window.TextEncoder){
        var bytes = new TextEncoder().encode(text);
        for(var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      } else {
        binary = unescape(encodeURIComponent(text));
      }
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    }catch(e){ return ''; }
  }

  function base64UrlDecode(token){
    try{
      var value = String(token || '').replace(/-/g, '+').replace(/_/g, '/');
      while(value.length % 4) value += '=';
      var binary = atob(value);
      if(window.TextDecoder){
        var bytes = new Uint8Array(binary.length);
        for(var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new TextDecoder().decode(bytes);
      }
      return decodeURIComponent(escape(binary));
    }catch(e){ return ''; }
  }

  function compactIssue(issue){
    if(!issue || typeof issue !== 'object') return issue;
    return {
      title: issue.title || issue.name || '',
      category: issue.category || issue.type || '',
      severity: issue.severity || issue.level || '',
      finding: issue.finding || issue.summary || issue.description || '',
      action: issue.action || issue.nextStep || issue.recommendation || '',
      amount: issue.amount || issue.estimatedAmount || ''
    };
  }

  function compactCase(caseData){
    if(!caseData || typeof caseData !== 'object') return {};
    var out = {
      patientName: caseData.patientName || caseData.name || '',
      provider: caseData.provider || caseData.providerName || '',
      amount: caseData.amount || caseData.billAmount || caseData.totalBilled || '',
      totalBilled: caseData.totalBilled || '',
      balance: caseData.balance || '',
      insurance: caseData.insurance || caseData.insuranceType || '',
      serviceDate: caseData.serviceDate || caseData.date_of_service || '',
      concernSummary: caseData.concernSummary || '',
      userDetail: caseData.userDetail || '',
      raw: clone(caseData.raw || {})
    };
    if(Array.isArray(caseData.issues)) out.issues = caseData.issues.slice(0, 12).map(compactIssue);
    if(caseData.letterPlan) out.letterPlan = clone(caseData.letterPlan);
    if(caseData.scripts) out.scripts = clone(caseData.scripts);
    if(caseData.nextSteps) out.nextSteps = clone(caseData.nextSteps);
    return out;
  }

  function queryObject(){
    var out = {};
    try{
      var params = new URLSearchParams(window.location.search || '');
      params.forEach(function(value, key){ out[key] = value; });
    }catch(e){}
    return out;
  }

  function currentSession(){
    var active = activeEnvelope();
    var activeCaseId = active.caseId || '';
    var sessions = [];
    [readJSON(CHECKOUT_KEY), readJSON(REVIEW_KEY)].forEach(function(session){
      if(!session) return;
      if(!activeCaseId || session.activeCaseId === activeCaseId || session.sessionId === activeCaseId || caseIdFromIntake(session.intake || {}) === activeCaseId) sessions.push(session);
    });
    if(active.session) sessions.push(active.session);
    sessions.sort(function(a,b){ return timeValue(b) - timeValue(a); });
    return sessions[0] || {};
  }

  function strongestSession(){
    var active = activeEnvelope();
    var activeCaseId = active.caseId || '';
    var sessions = [];
    [readJSON(CHECKOUT_KEY), readJSON(REVIEW_KEY)].forEach(function(session){
      if(session) sessions.push(session);
    });
    var paid = readJSON(PAID_KEY);
    if(paid && paid.session) sessions.push(paid.session);
    if(active.session) sessions.push(active.session);
    if(activeCaseId){
      sessions = sessions.filter(function(session){
        return session.activeCaseId === activeCaseId || session.sessionId === activeCaseId || caseIdFromIntake(session.intake || {}) === activeCaseId;
      });
    }
    sessions.sort(function(a,b){ return timeValue(b) - timeValue(a); });
    return sessions[0] || {};
  }

  function getIntake(){
    if(window.__UPA_PACKET_INTAKE__ && hasIntake(window.__UPA_PACKET_INTAKE__)) return window.__UPA_PACKET_INTAKE__;
    // newestIntakeCandidate() already checks ALL storage keys (active, intake, scan, checkout, review, paid, case)
    // and picks the most recent by timestamp — do NOT add per-key fallbacks below or stale paid data can resurface
    var candidate = newestIntakeCandidate();
    if(candidate && hasIntake(candidate.intake)){
      try{ window.__UPA_HYDRATION_DEBUG__ = { source:candidate.source, time:candidate.time, caseId:candidate.caseId }; }catch(e){}
      return activateIntake(candidate.intake, { stage:'active-case-selected', source:candidate.source }, { clearStale:false });
    }
    // Safety net: if all timed candidates are absent read INTAKE_KEY directly (written by activateIntake)
    var intake = readJSON(INTAKE_KEY);
    if(hasIntake(intake)){
      try{ window.__UPA_HYDRATION_DEBUG__ = { source:'intake-key-fallback', time:timeValue(intake), caseId:caseIdFromIntake(intake) }; }catch(e){}
      return intake;
    }
    try{ window.__UPA_HYDRATION_DEBUG__ = { source:'empty', time:0, caseId:'' }; }catch(e){}
    return {};
  }

  function restoreSession(meta){
    var session = strongestSession();
    var intake = getIntake();
    if(hasIntake(intake)) writeJSON(INTAKE_KEY, intake);
    if(session && typeof session === 'object'){
      session.restoredAt = now();
      session.restoreMeta = Object.assign({}, session.restoreMeta || {}, meta || {});
      if(hasIntake(intake)) session.intake = intake;
      writeJSON(CHECKOUT_KEY, session);
    }
    return { intake:intake, session:session };
  }

  function persistIntake(intake, meta){
    if(!hasIntake(intake)) return null;
    intake = activateIntake(intake, meta || {}, { clearStale:true });
    var session = currentSession();
    session.version = 3;
    session.sessionId = intake._upa_case_id || session.sessionId || ('upa-' + Date.now() + '-' + Math.random().toString(16).slice(2));
    session.activeCaseId = intake._upa_case_id || session.activeCaseId || session.sessionId;
    session.createdAt = session.createdAt || now();
    session.updatedAt = now();
    session.stage = (meta && meta.stage) || session.stage || 'intake';
    session.source = (meta && meta.source) || session.source || 'UPA';
    session.pageUrl = window.location.href;
    session.referrer = document.referrer || session.referrer || '';
    session.intake = clone(intake);
    session.meta = Object.assign({}, session.meta || {}, meta || {});
    writeJSON(INTAKE_KEY, session.intake);
    writeJSON(CHECKOUT_KEY, session);
    writeJSON(REVIEW_KEY, session);
    writeJSON(ACTIVE_KEY, Object.assign({}, activeEnvelope(), { caseId:session.activeCaseId, updatedAt:session.updatedAt, intake:clone(session.intake), session:clone(session) }));
    return session;
  }

  function persistCase(caseData, meta){
    var session = currentSession();
    var intake = getIntake();
    if(hasIntake(intake)) session.intake = intake;
    session.version = 3;
    session.activeCaseId = caseIdFromIntake(intake) || session.activeCaseId || session.sessionId;
    session.updatedAt = now();
    session.stage = (meta && meta.stage) || session.stage || 'case-generated';
    session.case = clone(caseData);
    session.caseGeneratedAt = now();
    session.meta = Object.assign({}, session.meta || {}, meta || {});
    writeJSON(CASE_KEY, session.case);
    writeJSON(CHECKOUT_KEY, session);
    writeJSON(REVIEW_KEY, session);
    writeJSON(ACTIVE_KEY, Object.assign({}, activeEnvelope(), { caseId:session.activeCaseId, updatedAt:session.updatedAt, intake:clone(session.intake || intake), session:clone(session), case:clone(session.case) }));
    return session;
  }

  function captureReviewState(meta){
    var intake = getIntake();
    var session = persistIntake(intake, meta) || currentSession();
    if(window.UPACase) session.case = clone(window.UPACase);
    session.updatedAt = now();
    session.stage = (meta && meta.stage) || session.stage || 'review';
    session.dashboard = Object.assign({}, session.dashboard || {}, {
      location: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      capturedAt: now()
    });
    session.meta = Object.assign({}, session.meta || {}, meta || {});
    writeJSON(CHECKOUT_KEY, session);
    writeJSON(REVIEW_KEY, session);
    writeJSON(DASHBOARD_KEY, session.dashboard);
    writeJSON(ACTIVE_KEY, Object.assign({}, activeEnvelope(), { caseId:session.activeCaseId || caseIdFromIntake(intake), updatedAt:session.updatedAt, intake:clone(session.intake || intake), session:clone(session), dashboard:clone(session.dashboard) }));
    return session;
  }

  function buildCasePayload(meta, mode){
    var session = captureReviewState(Object.assign({ stage:'case-token-build' }, meta || {})) || currentSession();
    var intake = getIntake();
    var caseData = window.UPACase || session.case || readJSON(CASE_KEY) || {};
    var dashboard = session.dashboard || readJSON(DASHBOARD_KEY) || {};
    var payload = {
      v:1,
      createdAt:now(),
      mode:mode || 'full',
      meta:clone(meta || {}),
      intake:clone(intake),
      session:clone(session),
      caseData:clone(caseData),
      dashboard:clone(dashboard)
    };
    if(mode === 'compact'){
      payload.session = {
        version:session.version || 3,
        sessionId:session.sessionId || '',
        createdAt:session.createdAt || '',
        updatedAt:session.updatedAt || now(),
        stage:session.stage || 'review',
        source:session.source || '',
        meta:clone(session.meta || {})
      };
      payload.caseData = compactCase(caseData);
    }
    if(mode === 'intake'){
      payload.session = {
        version:session.version || 3,
        sessionId:session.sessionId || '',
        createdAt:session.createdAt || '',
        updatedAt:now(),
        stage:'token-intake-restore',
        source:session.source || ''
      };
      payload.caseData = {};
      payload.dashboard = {};
    }
    return payload;
  }

  function encodePayload(payload){
    try{ return base64UrlEncode(JSON.stringify(payload || {})); }catch(e){ return ''; }
  }

  function storeToken(token){
    if(!token) return false;
    try{ sessionStorage.setItem(TOKEN_KEY, token); }catch(e){}
    try{ localStorage.setItem(TOKEN_KEY, token); }catch(e){}
    return true;
  }

  function exportCaseToken(meta){
    var modes = ['full', 'compact', 'intake'];
    var lastLength = 0;
    for(var i = 0; i < modes.length; i++){
      var token = encodePayload(buildCasePayload(meta, modes[i]));
      lastLength = token ? token.length : lastLength;
      if(token && token.length <= MAX_TOKEN_LENGTH){
        storeToken(token);
        return token;
      }
    }
    var session = currentSession();
    session.tokenSkipped = {
      reason:'case-token-too-large',
      lastLength:lastLength,
      maxLength:MAX_TOKEN_LENGTH,
      skippedAt:now()
    };
    writeJSON(CHECKOUT_KEY, session);
    writeJSON(REVIEW_KEY, session);
    return '';
  }

  function importCaseToken(token, meta){
    if(!token) return null;
    var text = base64UrlDecode(token);
    if(!text) return null;
    var payload = null;
    try{ payload = JSON.parse(text); }catch(e){ return null; }
    if(!payload || typeof payload !== 'object') return null;
    var intake = payload.intake || payload.i || {};
    var restoredSession = Object.assign({}, currentSession(), clone(payload.session || payload.s || {}));
    restoredSession.version = restoredSession.version || 3;
    restoredSession.updatedAt = now();
    restoredSession.stage = (meta && meta.stage) || 'token-restored';
    restoredSession.tokenRestoredAt = now();
    restoredSession.tokenMode = payload.mode || 'unknown';
    restoredSession.meta = Object.assign({}, restoredSession.meta || {}, payload.meta || {}, meta || {});
    if(hasIntake(intake)){
      restoredSession.intake = activateIntake(intake, Object.assign({ stage:'token-intake-restore' }, meta || {}), { clearStale:true });
      restoredSession.activeCaseId = caseIdFromIntake(restoredSession.intake);
      writeJSON(INTAKE_KEY, restoredSession.intake);
    }
    var caseData = payload.caseData || payload.case || payload.c || null;
    if(caseData && typeof caseData === 'object' && Object.keys(caseData).length){
      restoredSession.case = clone(caseData);
      writeJSON(CASE_KEY, restoredSession.case);
    }
    var dashboard = payload.dashboard || payload.d || null;
    if(dashboard && typeof dashboard === 'object' && Object.keys(dashboard).length){
      restoredSession.dashboard = clone(dashboard);
      writeJSON(DASHBOARD_KEY, restoredSession.dashboard);
    }
    writeJSON(CHECKOUT_KEY, restoredSession);
    writeJSON(REVIEW_KEY, restoredSession);
    writeJSON(ACTIVE_KEY, Object.assign({}, activeEnvelope(), { caseId:restoredSession.activeCaseId || caseIdFromIntake(restoredSession.intake || {}), updatedAt:restoredSession.updatedAt, intake:clone(restoredSession.intake || intake), session:clone(restoredSession), case:clone(restoredSession.case || {}) }));
    storeToken(token);
    return { ok:true, payload:payload, session:restoredSession, intake:restoredSession.intake || intake };
  }

  function restoreFromUrl(meta){
    var token = '';
    try{
      var params = new URLSearchParams(window.location.search || '');
      token = params.get(TOKEN_PARAM) || params.get('upa_case') || params.get('state') || '';
    }catch(e){}
    // Fallback: if no token in URL (e.g. user opened dashboard from Gumroad email link
    // rather than the post-purchase redirect), read the pre-checkout token we stored in
    // localStorage. markCheckout() writes this token before the user leaves for Gumroad.
    //
    // FRESHNESS GUARD: only accept the stored token if it was written within the last
    // 48 hours. A stale stored token from a previous purchase (e.g. "Hospital Trinidad"
    // from months ago) would otherwise get imported here and corrupt the active case —
    // the exact bug that caused old data to resurface on every new purchase.
    if(!token){
      try{
        var stored = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || '';
        if(stored){
          var MAX_STORED_TOKEN_AGE = 48 * 60 * 60 * 1000; // 48 hours in ms
          try{
            var tp = JSON.parse(base64UrlDecode(stored));
            var tokenAge = (tp && tp.createdAt) ? (Date.now() - Date.parse(tp.createdAt)) : Infinity;
            if(tokenAge < MAX_STORED_TOKEN_AGE){
              token = stored;
            } else {
              console.log('[UPA] restoreFromUrl: stored token is stale (' + Math.round(tokenAge / 3600000) + 'h old) — skipped');
            }
          }catch(pe){
            // Cannot decode token to check age — use it and let importCaseToken validate
            token = stored;
          }
        }
      }catch(e){}
    }
    return importCaseToken(token, Object.assign({ source: token ? 'stored-token' : 'no-token' }, meta || {}));
  }

  function compactRecoveryToken(intake){
    if(!hasIntake(intake)) return '';
    var core = {
      p: clean(intake.provider || intake.providerName || intake.extracted_provider || ''),
      a: clean(intake.bill_amount || intake.bill_amount_other || intake.balance || intake.totalBilled || intake.extracted_bill_amount || ''),
      d: clean(intake.date_of_service || intake.dos || intake.extracted_date_of_service || ''),
      i: clean(intake.insurance || intake.extracted_insurance || ''),
      s: clean(intake.payment_status || ''),
      n: clean(intake.patient_name || intake.patientName || intake.name || ''),
      c: clean(intake.concerns || intake.specificConcerns || ''),
      desc: clean(intake.description || ''),
      bt: clean(intake.bill_type || intake.billType || ''),
      co: clean(intake.concern_other || ''),
      em: clean(intake.email || ''),
      ph: clean(intake.phone || ''),
      cid: clean(intake._upa_case_id || intake.active_case_id || intake.caseId || ''),
      ts: clean(intake.submitted_at || intake._upa_active_at || now())
    };
    Object.keys(core).forEach(function(key){ if(!core[key]) delete core[key]; });
    if(!Object.keys(core).length) return '';
    try{ return base64UrlEncode(JSON.stringify(core)); }catch(e){ return ''; }
  }

  function checkoutRecoveryToken(){
    var token = '';
    try{ token = sessionStorage.getItem('upa.recovery.params.v1') || ''; }catch(e){}
    if(!token){ try{ token = localStorage.getItem('upa.recovery.params.v1') || ''; }catch(e){} }
    if(token) return token;
    var active = activeEnvelope();
    token = compactRecoveryToken((active && active.intake) || readJSON(INTAKE_KEY) || {});
    if(token){
      try{ sessionStorage.setItem('upa.recovery.params.v1', token); }catch(e){}
      try{ localStorage.setItem('upa.recovery.params.v1', token); }catch(e){}
    }
    return token;
  }

  function successUrlWithToken(meta){
    var fallback = '/success';
    try{
      var url = new URL('/success', window.location.origin);
      var token = exportCaseToken(Object.assign({ stage:'success-link-token' }, meta || {}));
      if(token && token.length <= MAX_CASE_PARAM_LENGTH) url.searchParams.set(TOKEN_PARAM, token);
      return url.href;
    }catch(e){
      return fallback;
    }
  }

  function checkoutUrlWithToken(gumroadUrl, meta){
    var href = gumroadUrl || '';
    try{
      captureReviewState(Object.assign({ stage:'checkout-local-handoff' }, meta || {}));
      var url = new URL(href, window.location.href);
      url.searchParams.set('upa_checkout', '1');
      var successBase = window.location.origin + '/UPA-Final/05_upa-success.html';
      var successUrl = new URL(successBase);
      var hasHandoff = false;

      // ── EMBED CASE TOKEN IN GUMROAD REDIRECT URL ──────────────────────────
      // Gumroad supports a ?redirect=URL parameter that overrides where the
      // buyer lands after payment. We build our success URL with the case token
      // already embedded (?case=TOKEN). This makes the token survive even when
      // the user purchases in one browser context (incognito) and opens the
      // dashboard from a Gumroad email link in another context (regular Chrome),
      // because the token travels IN THE URL rather than in localStorage.
      try{
        var token = exportCaseToken(Object.assign({ stage:'checkout-url-token' }, meta || {}));
        if(token && token.length <= MAX_CASE_PARAM_LENGTH){
          successUrl.searchParams.set(TOKEN_PARAM, token);
          hasHandoff = true;
        }
      }catch(re){}
      if(!hasHandoff){
        var recoveryToken = checkoutRecoveryToken();
        if(recoveryToken && recoveryToken.length <= MAX_CASE_PARAM_LENGTH){
          successUrl.searchParams.set('r', recoveryToken);
          hasHandoff = true;
        }
      }
      if(hasHandoff) url.searchParams.set('redirect', successUrl.href);

      return url.href.length <= MAX_CHECKOUT_URL_LENGTH ? url.href : href;
    }catch(e){
      return href;
    }
  }

  function markCheckout(meta){
    var session = captureReviewState(Object.assign({ stage:'checkout-started' }, meta || {}));
    session.checkoutStartedAt = now();
    session.gumroadUrl = meta && meta.gumroadUrl ? meta.gumroadUrl : session.gumroadUrl;
    session.returnUrl = '/success';
    session.paid = false;
    writeJSON(CHECKOUT_KEY, session);
    writeJSON(REVIEW_KEY, session);
    writeJSON(ACTIVE_KEY, Object.assign({}, activeEnvelope(), { caseId:session.activeCaseId || caseIdFromIntake(session.intake || {}), updatedAt:session.updatedAt || session.checkoutStartedAt, intake:clone(session.intake || {}), session:clone(session) }));
    // ── PRE-CHECKOUT TOKEN: write case token to localStorage NOW so it survives the
    // Gumroad redirect and the email link (which carries no URL token). When the
    // success page opens from the email, restoreFromUrl() will find it in localStorage
    // even when the URL has no ?case= parameter.
    try{ exportCaseToken({ stage:'pre-checkout-token', source:'mark-checkout' }); }catch(e){}
    return session;
  }

  function markPaid(meta){
    var session = restoreSession({ stage:'success-restore' }).session || currentSession();
    var intake = getIntake();
    if(hasIntake(intake)) session.intake = intake;
    session.version = 3;
    session.activeCaseId = caseIdFromIntake(session.intake || intake) || session.activeCaseId || session.sessionId;
    session.paid = true;
    session.stage = 'paid-success';
    session.paidAt = session.paidAt || now();
    session.updatedAt = now();
    session.successUrl = window.location.href;
    session.successParams = queryObject();
    session.licenseKey = meta && meta.licenseKey ? meta.licenseKey : session.licenseKey;
    session.meta = Object.assign({}, session.meta || {}, meta || {});
    writeJSON(CHECKOUT_KEY, session);
    writeJSON(REVIEW_KEY, session);
    writeJSON(PAID_KEY, { paid:true, paidAt:session.paidAt, session:session, intake:session.intake || {} });
    if(hasIntake(session.intake)) writeJSON(INTAKE_KEY, session.intake);
    writeJSON(ACTIVE_KEY, Object.assign({}, activeEnvelope(), { caseId:session.activeCaseId, updatedAt:session.updatedAt, intake:clone(session.intake || {}), session:clone(session), paid:true }));
    try{ sessionStorage.setItem('upa.paid', '1'); localStorage.setItem('upa.paid', '1'); }catch(e){}
    return session;
  }

  window.UPAState = {
    keys:{
      intake:INTAKE_KEY,
      checkout:CHECKOUT_KEY,
      paid:PAID_KEY,
      review:REVIEW_KEY,
      caseSnapshot:CASE_KEY,
      dashboard:DASHBOARD_KEY,
      token:TOKEN_KEY,
      active:ACTIVE_KEY,
      scan:SCAN_KEY
    },
    readJSON:readJSON,
    writeJSON:writeJSON,
    hasIntake:hasIntake,
    getIntake:getIntake,
    activeCase:activeEnvelope,
    activateIntake:activateIntake,
    restoreSession:restoreSession,
    persistIntake:persistIntake,
    persistCase:persistCase,
    captureReviewState:captureReviewState,
    exportCaseToken:exportCaseToken,
    caseToken:exportCaseToken,
    importCaseToken:importCaseToken,
    restoreFromUrl:restoreFromUrl,
    successUrlWithToken:successUrlWithToken,
    checkoutUrlWithToken:checkoutUrlWithToken,
    markCheckout:markCheckout,
    markPaid:markPaid
  };

  restoreSession({ stage:'script-load' });
})();
