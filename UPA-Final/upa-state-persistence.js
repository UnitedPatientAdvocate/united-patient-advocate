(function(){
  'use strict';

  var INTAKE_KEY = 'upa.intake.v1';
  var CHECKOUT_KEY = 'upa.checkout.session.v2';
  var PAID_KEY = 'upa.paid.results.v2';
  var REVIEW_KEY = 'upa.review.session.v1';
  var CASE_KEY = 'upa.case.snapshot.v1';
  var DASHBOARD_KEY = 'upa.dashboard.state.v1';
  var TOKEN_KEY = 'upa.case.handoff.token.v1';
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
    return readJSON(CHECKOUT_KEY) || readJSON(REVIEW_KEY) || {};
  }

  function strongestSession(){
    var paid = readJSON(PAID_KEY);
    if(paid && paid.session) return paid.session;
    return readJSON(CHECKOUT_KEY) || readJSON(REVIEW_KEY) || {};
  }

  function getIntake(){
    if(window.__UPA_PACKET_INTAKE__ && hasIntake(window.__UPA_PACKET_INTAKE__)) return window.__UPA_PACKET_INTAKE__;
    var intake = readJSON(INTAKE_KEY);
    if(hasIntake(intake)) return intake;
    var paid = readJSON(PAID_KEY);
    if(paid && paid.session && hasIntake(paid.session.intake)) return paid.session.intake;
    if(paid && hasIntake(paid.intake)) return paid.intake;
    var checkout = readJSON(CHECKOUT_KEY);
    if(checkout && hasIntake(checkout.intake)) return checkout.intake;
    var review = readJSON(REVIEW_KEY);
    if(review && hasIntake(review.intake)) return review.intake;
    var savedCase = readJSON(CASE_KEY);
    if(savedCase && hasIntake(savedCase.raw)) return savedCase.raw;
    // Final fallback: scan session — normalize scan fields into intake-compatible shape
    var scan = readJSON('upa.scan.v1');
    if(scan && (scan.provider || scan.totalBilled != null || scan.patientBalance != null)){
      var scanAmt = scan.patientBalance != null ? scan.patientBalance : (scan.totalBilled != null ? scan.totalBilled : null);
      var fmtAmt = scanAmt != null ? ('$' + Number(scanAmt).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})) : '';
      return {
        _scan:                           true,
        provider:                        scan.provider || '',
        bill_amount:                     fmtAmt,
        bill_amount_other:               fmtAmt,
        extracted_bill_amount:           scanAmt != null ? String(scanAmt) : '',
        extracted_bill_amount_confidence: scanAmt != null ? 0.9 : 0,
        date_of_service:                 scan.serviceDateRaw || scan.serviceDate || '',
        insurance:                       scan.insuranceName || '',
        _patient_balance:                scan.patientBalance,
        _total_billed:                   scan.totalBilled,
        _claim_number:                   scan.claimNumber || '',
        _confidence:                     scan.confidence || '',
        _denial:                         !!scan.denialDetected,
        _has_duplicates:                 !!scan.hasDuplicateCodes,
        _cpt_codes:                      scan.cptCodes || [],
        _page_count:                     scan.pageCount || 1,
        _scan_ts:                        scan._scanTimestamp || ''
      };
    }
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
    var session = currentSession();
    session.version = 3;
    session.sessionId = session.sessionId || ('upa-' + Date.now() + '-' + Math.random().toString(16).slice(2));
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
    return session;
  }

  function persistCase(caseData, meta){
    var session = currentSession();
    var intake = getIntake();
    if(hasIntake(intake)) session.intake = intake;
    session.version = 3;
    session.updatedAt = now();
    session.stage = (meta && meta.stage) || session.stage || 'case-generated';
    session.case = clone(caseData);
    session.caseGeneratedAt = now();
    session.meta = Object.assign({}, session.meta || {}, meta || {});
    writeJSON(CASE_KEY, session.case);
    writeJSON(CHECKOUT_KEY, session);
    writeJSON(REVIEW_KEY, session);
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
      restoredSession.intake = clone(intake);
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
    storeToken(token);
    return { ok:true, payload:payload, session:restoredSession, intake:restoredSession.intake || intake };
  }

  function restoreFromUrl(meta){
    var token = '';
    try{
      var params = new URLSearchParams(window.location.search || '');
      token = params.get(TOKEN_PARAM) || params.get('upa_case') || params.get('state') || '';
    }catch(e){}
    return importCaseToken(token, Object.assign({ source:'url-token' }, meta || {}));
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
    return session;
  }

  function markPaid(meta){
    var session = restoreSession({ stage:'success-restore' }).session || currentSession();
    var intake = getIntake();
    if(hasIntake(intake)) session.intake = intake;
    session.version = 3;
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
      token:TOKEN_KEY
    },
    readJSON:readJSON,
    writeJSON:writeJSON,
    hasIntake:hasIntake,
    getIntake:getIntake,
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
