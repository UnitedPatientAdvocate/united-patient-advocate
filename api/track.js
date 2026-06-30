const ALLOWED_EVENTS = new Set([
  'page_view',
  'landing_view',
  'upload_page_viewed',
  'upload_started',
  'upload_completed',
  'upload_cancelled',
  'upload_failed',
  'analysis_completed',
  'analysis_failed',
  'findings_viewed',
  'checkout_link_click',
  'checkout_start',
  'checkout_viewed',
  'begin_checkout',
  'checkout_blocked',
  'external_checkout_opened',
  'purchase',
  'dashboard_unlocked',
  'license_verification_failed',
  'purchase_handoff_viewed',
  'manual_intake_viewed',
  'manual_intake_completed',
  'sale',
  'sale_dashboard_click'
]);

function clean(value, maxLength = 120) {
  return String(value || '').replace(/[\r\n\t]/g, ' ').trim().slice(0, maxLength);
}

function cleanMeta(meta) {
  if (!meta || typeof meta !== 'object') return {};
  return Object.keys(meta).slice(0, 20).reduce((out, key) => {
    const safeKey = clean(key, 40);
    if (safeKey) out[safeKey] = clean(meta[key], 300);
    return out;
  }, {});
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = req.body || {};
  const eventName = clean(body.event, 80);

  if (!ALLOWED_EVENTS.has(eventName)) {
    return res.status(400).json({ ok: false, error: 'Unsupported event' });
  }

  const record = {
    serverAt: new Date().toISOString(),
    id: clean(body.id, 120),
    event: eventName,
    occurredAt: clean(body.occurredAt, 40),
    visitorId: clean(body.visitorId, 120),
    visitSessionId: clean(body.visitSessionId, 120),
    source: clean(body.source || 'direct', 40),
    firstSource: clean(body.firstSource || body.source || 'direct', 40),
    path: clean(body.path, 200),
    url: clean(body.url, 600),
    referrer: clean(body.referrer || req.headers.referer || '', 600),
    userAgent: clean(req.headers['user-agent'], 300),
    meta: cleanMeta(body.meta)
  };

  console.log('[UPA_TRACK]', JSON.stringify(record));

  return res.status(200).json({ ok: true });
}
