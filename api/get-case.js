const { Redis } = require('@upstash/redis');

const CASE_KEY_PREFIX = 'upa:case:v1:';
const CASE_ID_PATTERN = /^[A-Za-z0-9_-]{32}$/;

function readCaseId(req) {
  const queryId = req.query && req.query.caseId;
  const value = Array.isArray(queryId) ? queryId[0] : queryId;
  return String(value || '').trim();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const caseId = readCaseId(req);
  if (!CASE_ID_PATTERN.test(caseId)) {
    return res.status(400).json({ ok: false, error: 'A valid case ID is required' });
  }

  try {
    const redis = Redis.fromEnv();
    const caseData = await redis.get(`${CASE_KEY_PREFIX}${caseId}`);

    if (caseData == null) {
      return res.status(404).json({ ok: false, error: 'Case not found' });
    }

    if (!caseData || typeof caseData !== 'object' || Array.isArray(caseData)) {
      console.error('[api/get-case] Stored case payload is invalid', { caseId });
      return res.status(500).json({ ok: false, error: 'Stored case is invalid' });
    }

    return res.status(200).json({ ok: true, caseId, case: caseData });
  } catch (error) {
    console.error('[api/get-case] Redis read failed', { message: error?.message });
    return res.status(503).json({ ok: false, error: 'Case could not be retrieved' });
  }
};
