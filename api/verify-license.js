// Serverless license verification for United Patient Advocate.
//
// Verifies a Gumroad license key server-side so the paid dashboard can never be
// unlocked from the frontend alone. The Gumroad seller API token is read from a
// Vercel environment variable and is NEVER hardcoded or exposed to the browser.
//
// Required Vercel environment variable: GUMROAD_SELLER_API_TOKEN

const GUMROAD_VERIFY_URL = 'https://api.gumroad.com/v2/licenses/verify';
const GUMROAD_PRODUCT_ID = 'CFmx8uGuFCzTnO1r0QffBQ==';

async function readBody(req) {
  if (req.body && typeof req.body !== 'string') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, error: 'Method not allowed' });
  }

  const token = process.env.GUMROAD_SELLER_API_TOKEN;
  if (!token) {
    console.error('[api/verify-license] Missing GUMROAD_SELLER_API_TOKEN runtime environment variable');
    return res.status(500).json({ valid: false, error: 'License verification is not configured' });
  }

  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    return res.status(400).json({ valid: false, error: 'Invalid JSON request body' });
  }

  const licenseKey = String(body.licenseKey || body.license_key || '').trim();
  if (!licenseKey) {
    return res.status(400).json({ valid: false, error: 'Missing license key' });
  }

  let data;
  try {
    const params = new URLSearchParams();
    params.set('product_id', GUMROAD_PRODUCT_ID);
    params.set('license_key', licenseKey);
    params.set('increment_uses_count', 'true');
    params.set('access_token', token);

    const response = await fetch(GUMROAD_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    data = await response.json();
  } catch (error) {
    console.error('[api/verify-license] Gumroad request failed', { message: error?.message });
    return res.status(502).json({ valid: false, error: 'Could not reach the license verification service' });
  }

  // A non-success response means the key does not exist for this product.
  if (!data || data.success !== true) {
    return res.status(200).json({ valid: false, error: 'Invalid license key' });
  }

  const purchase = data.purchase && typeof data.purchase === 'object' ? data.purchase : {};

  // Test purchases (Gumroad test-mode keys) bypass the refund/dispute/uses gate.
  if (purchase.test === true) {
    return res.status(200).json({ valid: true, test: true });
  }

  const refunded = purchase.refunded === true;
  const disputed = purchase.disputed === true || purchase.chargebacked === true;
  const uses = typeof data.uses === 'number' ? data.uses : Number(data.uses || 0);

  const valid = data.success === true && !refunded && !disputed && uses <= 1;

  return res.status(200).json(
    valid
      ? { valid: true }
      : { valid: false, error: 'This license key is not valid for activation' }
  );
};
