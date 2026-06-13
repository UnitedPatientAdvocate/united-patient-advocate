const crypto = require('node:crypto');
const { Redis } = require('@upstash/redis');

const CASE_KEY_PREFIX = 'upa:case:v1:';
const CASE_TTL_SECONDS = 90 * 24 * 60 * 60;
const MAX_CASE_BYTES = 1_500_000;
const MAX_WRITE_ATTEMPTS = 3;

async function readBody(req) {
  if (req.body && typeof req.body !== 'string') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_CASE_BYTES) {
      const error = new Error('Case payload is too large');
      error.code = 'PAYLOAD_TOO_LARGE';
      throw error;
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function validCase(caseData) {
  return !!caseData
    && typeof caseData === 'object'
    && !Array.isArray(caseData)
    && Object.keys(caseData).length > 0;
}

function caseSize(caseData) {
  return Buffer.byteLength(JSON.stringify(caseData), 'utf8');
}

function createCaseId() {
  return crypto.randomBytes(24).toString('base64url');
}

function redisErrorDetail(error) {
  return {
    name: error?.name || 'Error',
    message: error?.message || String(error || 'Unknown Redis error'),
    code: error?.code || null,
    status: error?.status || error?.statusCode || null
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let caseData;
  try {
    caseData = await readBody(req);
  } catch (error) {
    const status = error && error.code === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
    return res.status(status).json({
      ok: false,
      error: status === 413 ? 'Case payload is too large' : 'Invalid JSON request body'
    });
  }

  if (!validCase(caseData)) {
    return res.status(400).json({ ok: false, error: 'A non-empty case object is required' });
  }

  let payloadBytes;
  try {
    payloadBytes = caseSize(caseData);
  } catch (error) {
    return res.status(400).json({ ok: false, error: 'Case payload must be valid JSON' });
  }

  if (payloadBytes > MAX_CASE_BYTES) {
    return res.status(413).json({ ok: false, error: 'Case payload is too large' });
  }

  try {
    const redis = Redis.fromEnv();
    const writeResults = [];

    for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
      const caseId = createCaseId();
      const result = await redis.set(`${CASE_KEY_PREFIX}${caseId}`, caseData, {
        ex: CASE_TTL_SECONDS,
        nx: true
      });
      writeResults.push({ attempt: attempt + 1, result, resultType: typeof result });

      if (result === 'OK') {
        return res.status(201).json({ ok: true, caseId });
      }
    }

    console.error('[api/store-case] Could not reserve a unique case ID', {
      payloadBytes,
      writeResults
    });
    return res.status(503).json({
      ok: false,
      error: 'Case could not be stored',
      diagnostic: {
        reason: 'SET with NX did not return OK',
        payloadBytes,
        writeResults
      }
    });
  } catch (error) {
    const detail = redisErrorDetail(error);
    console.error('[api/store-case] Redis write failed', { payloadBytes, detail });
    return res.status(503).json({
      ok: false,
      error: 'Case could not be stored',
      diagnostic: {
        reason: 'Redis SET threw an exception',
        payloadBytes,
        detail
      }
    });
  }
};
