const { Redis } = require('@upstash/redis');

const CASE_KEY_PREFIX = 'upa:case:v1:';
const CASE_TTL_SECONDS = 90 * 24 * 60 * 60;
const CASE_ID_PATTERN = /^[A-Za-z0-9_-]{32}$/;
const MAX_NAME_LENGTH = 120;

function readBody(req) {
  if (req.body && typeof req.body !== 'string') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  return {};
}

function cleanName(value) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME_LENGTH);
}

function applyBuyerName(caseData, patientName) {
  caseData.buyerName = patientName;
  caseData.patientName = patientName;
  caseData.patient_name = patientName;
  caseData.name = patientName;
  caseData.buyerNameUpdatedAt = new Date().toISOString();
  if (!caseData.intake || typeof caseData.intake !== 'object' || Array.isArray(caseData.intake)) {
    caseData.intake = {};
  }
  caseData.intake.buyerName = patientName;
  caseData.intake.patientName = patientName;
  caseData.intake.patient_name = patientName;
  caseData.intake.name = patientName;
  return caseData;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body;
  try {
    body = readBody(req);
  } catch (error) {
    return res.status(400).json({ ok: false, error: 'Invalid JSON request body' });
  }

  const caseId = String(body.caseId || '').trim();
  const patientName = cleanName(body.patientName);
  if (!CASE_ID_PATTERN.test(caseId)) {
    return res.status(400).json({ ok: false, error: 'A valid case ID is required' });
  }

  try {
    const redis = Redis.fromEnv();
    const key = `${CASE_KEY_PREFIX}${caseId}`;
    const caseData = await redis.get(key);
    if (caseData == null) {
      return res.status(404).json({ ok: false, error: 'Case not found' });
    }
    if (!caseData || typeof caseData !== 'object' || Array.isArray(caseData)) {
      return res.status(500).json({ ok: false, error: 'Stored case is invalid' });
    }

    const updatedCase = applyBuyerName(caseData, patientName);
    const stored = await redis.set(key, updatedCase, { ex: CASE_TTL_SECONDS });
    if (stored !== 'OK') {
      throw new Error('Case update was not confirmed');
    }

    return res.status(200).json({ ok: true, caseId, case: updatedCase });
  } catch (error) {
    console.error('[api/update-case] Redis update failed', { message: error?.message });
    return res.status(503).json({ ok: false, error: 'Case could not be updated' });
  }
};
