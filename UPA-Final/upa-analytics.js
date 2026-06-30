(function(global) {
  'use strict';

  var GA4_ID = 'G-E9M0HYG0GS';
  var ADS_ID = 'AW-18266741864';
  var ATTRIBUTION_KEY = 'upa.analytics.attribution.v1';
  var VISITOR_KEY = 'upa.analytics.visitor.v1';
  var SESSION_KEY = 'upa.analytics.session.v1';
  var ONCE_PREFIX = 'upa.analytics.once.v1:';
  var SENSITIVE_QUERY_KEYS = [
    'access', 'caseId', 'r', 'case', 'license_key', 'key', 'token',
    'to', 'redirect', 'email', 'email_address', 'name', 'patientName'
  ];
  var API_EVENTS = {
    landing_view: true,
    upload_page_viewed: true,
    upload_started: true,
    upload_completed: true,
    upload_cancelled: true,
    upload_failed: true,
    analysis_completed: true,
    analysis_failed: true,
    findings_viewed: true,
    checkout_viewed: true,
    begin_checkout: true,
    checkout_blocked: true,
    purchase: true,
    dashboard_unlocked: true,
    license_verification_failed: true,
    purchase_handoff_viewed: true,
    manual_intake_viewed: true,
    manual_intake_completed: true
  };

  function clean(value, maxLength) {
    return String(value == null ? '' : value)
      .replace(/[\r\n\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength || 100);
  }

  function safeCampaignValue(value) {
    var text = clean(value, 80);
    if (!text || /@|%40|(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}/i.test(text)) return '';
    return text.replace(/[^a-z0-9._/-]/gi, '_');
  }

  function readStorage(storage, key) {
    try {
      var raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeStorage(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function randomId(prefix) {
    var value = '';
    try {
      value = global.crypto && typeof global.crypto.randomUUID === 'function'
        ? global.crypto.randomUUID()
        : '';
    } catch (error) {}
    if (!value) {
      value = Date.now().toString(36) + Math.random().toString(36).slice(2, 14);
    }
    return prefix + value.replace(/[^a-z0-9]/gi, '').slice(0, 32);
  }

  function visitorId() {
    var value = '';
    try { value = localStorage.getItem(VISITOR_KEY) || ''; } catch (error) {}
    if (!value) {
      value = randomId('v_');
      try { localStorage.setItem(VISITOR_KEY, value); } catch (error) {}
    }
    return value;
  }

  function visitSessionId() {
    var value = '';
    try { value = sessionStorage.getItem(SESSION_KEY) || ''; } catch (error) {}
    if (!value) {
      value = randomId('s_');
      try { sessionStorage.setItem(SESSION_KEY, value); } catch (error) {}
    }
    return value;
  }

  function sanitizedPageLocation() {
    try {
      var url = new URL(global.location.href);
      SENSITIVE_QUERY_KEYS.forEach(function(key) { url.searchParams.delete(key); });
      return url.href;
    } catch (error) {
      return global.location.origin + global.location.pathname;
    }
  }

  function currentAttribution() {
    var params;
    try { params = new URLSearchParams(global.location.search || ''); }
    catch (error) { params = new URLSearchParams(); }

    var clickType = params.get('gclid') ? 'gclid'
      : params.get('gbraid') ? 'gbraid'
        : params.get('wbraid') ? 'wbraid'
          : '';
    var source = safeCampaignValue(params.get('utm_source') || params.get('src') || (clickType ? 'google' : ''));
    var medium = safeCampaignValue(params.get('utm_medium') || (clickType ? 'cpc' : ''));
    var campaign = safeCampaignValue(params.get('utm_campaign') || '');
    var referrerHost = '';
    try { referrerHost = document.referrer ? new URL(document.referrer).hostname : ''; }
    catch (error) {}

    return {
      source: source || (referrerHost ? safeCampaignValue(referrerHost) : 'direct'),
      medium: medium || (referrerHost ? 'referral' : 'none'),
      campaign: campaign || 'none',
      clickIdType: clickType || 'none',
      capturedAt: new Date().toISOString()
    };
  }

  function captureAttribution() {
    var stored = readStorage(localStorage, ATTRIBUTION_KEY) || {};
    var current = currentAttribution();
    var hasCampaignSignal = current.source !== 'direct'
      || current.medium !== 'none'
      || current.campaign !== 'none'
      || current.clickIdType !== 'none';
    var first = stored.first || current;
    var last = hasCampaignSignal ? current : (stored.last || current);
    var next = { first: first, last: last };
    writeStorage(localStorage, ATTRIBUTION_KEY, next);
    return next;
  }

  function attribution() {
    return readStorage(localStorage, ATTRIBUTION_KEY) || captureAttribution();
  }

  function once(key, persistent) {
    if (!key) return true;
    var storage = persistent ? localStorage : sessionStorage;
    var fullKey = ONCE_PREFIX + clean(key, 120);
    try {
      if (storage.getItem(fullKey)) return false;
      storage.setItem(fullKey, new Date().toISOString());
      return true;
    } catch (error) {
      return true;
    }
  }

  function transactionId(value) {
    var text = clean(value, 300);
    var hash1 = 2166136261;
    var hash2 = 2246822519;
    for (var i = 0; i < text.length; i += 1) {
      hash1 ^= text.charCodeAt(i);
      hash1 = Math.imul(hash1, 16777619);
      hash2 ^= text.charCodeAt(i);
      hash2 = Math.imul(hash2, 3266489917);
    }
    return 'upa_' + (hash1 >>> 0).toString(36) + (hash2 >>> 0).toString(36);
  }

  function safeEventParams(params) {
    var input = params && typeof params === 'object' ? params : {};
    var allowed = [
      'funnel_step', 'view_context', 'upload_source', 'file_format',
      'extraction_method', 'page_count_bucket', 'failure_stage',
      'case_status', 'generation_mode', 'value', 'currency',
      'transaction_id', 'items', 'debug_mode'
    ];
    var out = {};
    allowed.forEach(function(key) {
      if (input[key] == null || input[key] === '') return;
      if (key === 'items' && Array.isArray(input[key])) {
        out.items = input[key].slice(0, 3).map(function(item) {
          return {
            item_id: clean(item && item.item_id, 60),
            item_name: clean(item && item.item_name, 80),
            price: Number(item && item.price) || 0,
            quantity: Number(item && item.quantity) || 1
          };
        });
      } else if (key === 'value') {
        out[key] = Number(input[key]) || 0;
      } else if (key === 'debug_mode') {
        out[key] = input[key] === true;
      } else {
        out[key] = clean(input[key], 100);
      }
    });
    var attr = attribution();
    out.upa_source = attr.last.source;
    out.upa_medium = attr.last.medium;
    out.upa_campaign = attr.last.campaign;
    out.upa_first_source = attr.first.source;
    out.page_path = global.location.pathname;
    if (new URLSearchParams(global.location.search || '').get('upa_debug') === '1') out.debug_mode = true;
    return out;
  }

  function apiMeta(params) {
    var out = {};
    ['funnel_step', 'view_context', 'upload_source', 'file_format', 'extraction_method',
      'page_count_bucket', 'failure_stage', 'case_status', 'generation_mode',
      'transaction_id', 'currency', 'value'].forEach(function(key) {
      if (params[key] != null && params[key] !== '') out[key] = params[key];
    });
    return out;
  }

  function sendApi(eventName, params) {
    if (!API_EVENTS[eventName]) return;
    var attr = attribution();
    try {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          id: randomId('e_'),
          event: eventName,
          occurredAt: new Date().toISOString(),
          visitorId: visitorId(),
          visitSessionId: visitSessionId(),
          source: attr.last.source,
          firstSource: attr.first.source,
          path: global.location.pathname,
          url: sanitizedPageLocation(),
          referrer: document.referrer ? (function() {
            try { return new URL(document.referrer).origin; } catch (error) { return ''; }
          })() : '',
          meta: apiMeta(params)
        })
      }).catch(function() {});
    } catch (error) {}
  }

  function track(eventName, params, options) {
    var opts = options || {};
    if (opts.onceKey && !once(eventName + ':' + opts.onceKey, opts.persistent === true)) return false;
    var safeParams = safeEventParams(params);
    safeParams.send_to = GA4_ID;
    try {
      if (typeof global.gtag === 'function') global.gtag('event', eventName, safeParams);
    } catch (error) {}
    sendApi(eventName, safeParams);
    return true;
  }

  function productItem() {
    return {
      item_id: 'upa_full_dispute_kit',
      item_name: 'UPA Full Dispute Kit',
      price: 97,
      quantity: 1
    };
  }

  function trackBeginCheckout(context) {
    return track('begin_checkout', {
      funnel_step: 'checkout_started',
      view_context: context || 'funnel',
      value: 97,
      currency: 'USD',
      items: [productItem()]
    }, { onceKey: visitSessionId() });
  }

  function autoTrackPage() {
    var path = global.location.pathname.toLowerCase();
    if (/01_upa-landing\.html$/.test(path) || path === '/') {
      track('landing_view', { funnel_step: 'landing' }, { onceKey: visitSessionId() });
    } else if (/00_upa-scan\.html$/.test(path)) {
      track('upload_page_viewed', { funnel_step: 'upload_page' }, { onceKey: visitSessionId() });
    } else if (/03_upa-preview\.html$/.test(path)) {
      track('findings_viewed', { funnel_step: 'findings_viewed', view_context: 'preview_page' }, { onceKey: 'preview:' + visitSessionId() });
    } else if (/06_upa-checkout\.html$/.test(path) || path === '/checkout') {
      track('checkout_viewed', { funnel_step: 'checkout_viewed', case_status: 'pending_validation' }, { onceKey: visitSessionId() });
    } else if (/05_upa-success\.html$/.test(path) || path === '/success') {
      track('purchase_handoff_viewed', { funnel_step: 'purchase_handoff' }, { onceKey: visitSessionId() });
    } else if (/07_upa-manual-intake\.html$/.test(path)) {
      track('manual_intake_viewed', { funnel_step: 'manual_intake' }, { onceKey: visitSessionId() });
    }
  }

  captureAttribution();

  global.UPAAnalytics = {
    ga4Id: GA4_ID,
    adsId: ADS_ID,
    attribution: attribution,
    captureAttribution: captureAttribution,
    sanitizedPageLocation: sanitizedPageLocation,
    transactionId: transactionId,
    visitorId: visitorId,
    visitSessionId: visitSessionId,
    productItem: productItem,
    track: track,
    trackBeginCheckout: trackBeginCheckout
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoTrackPage, { once: true });
  } else {
    autoTrackPage();
  }
})(window);
