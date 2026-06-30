const MAX_REQUEST_BYTES = 4_000_000;
const MAX_IMAGES = 4;
const ANTHROPIC_TIMEOUT_MS = 45_000;
const MODEL = 'claude-sonnet-4-6';

async function readBody(req) {
  if (req.body && typeof req.body !== 'string') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_REQUEST_BYTES) {
      const error = new Error('Upload is too large to read');
      error.code = 'PAYLOAD_TOO_LARGE';
      throw error;
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function parseDataUrl(value) {
  const match = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=\s]+)$/i.exec(String(value || ''));
  if (!match) return null;
  return {
    mediaType: match[1].toLowerCase(),
    data: match[2].replace(/\s+/g, '')
  };
}

function cleanText(value, maxLength = 500) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanMoney(value) {
  const number = Number(String(value == null ? '' : value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function cleanLineItems(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 150).map(item => {
    if (!item || typeof item !== 'object') return null;
    const code = cleanText(item.code || item.hcpcs || item.cpt, 16).toUpperCase();
    const billedAmount = cleanMoney(item.billedAmount);
    if (!code || billedAmount === null) return null;
    return {
      code,
      modifier: cleanText(item.modifier, 8).toUpperCase(),
      billedAmount,
      shortDescription: cleanText(item.shortDescription || item.description, 180)
    };
  }).filter(Boolean);
}

function normalizeResult(value, pageCount) {
  const data = value && typeof value === 'object' ? value : {};
  const lineItems = cleanLineItems(data.lineItems);
  const cptCodes = Array.from(new Set(
    (Array.isArray(data.cptCodes) ? data.cptCodes : [])
      .concat(lineItems.map(item => item.code))
      .map(code => cleanText(code, 16).toUpperCase())
      .filter(Boolean)
  ));
  const result = {
    provider: cleanText(data.provider, 240) || null,
    serviceDate: cleanText(data.serviceDate, 80) || null,
    serviceDateRaw: cleanText(data.serviceDateRaw || data.serviceDate, 80) || null,
    totalBilled: cleanMoney(data.totalBilled),
    patientBalance: cleanMoney(data.patientBalance),
    insurancePaid: cleanMoney(data.insurancePaid),
    adjustmentAmount: cleanMoney(data.adjustmentAmount),
    allAmounts: [],
    claimNumber: cleanText(data.claimNumber, 120) || null,
    insuranceName: cleanText(data.insuranceName, 160) || null,
    state: cleanText(data.state, 2).toUpperCase(),
    cptCodes,
    hasDuplicateCodes: false,
    duplicateCodes: [],
    codeAnalysis: lineItems,
    lineItems,
    denialDetected: data.denialDetected === true,
    financialAssistanceDetected: data.financialAssistanceDetected === true,
    pageCount,
    rawText: cleanText(data.rawText, 75_000),
    lines: [],
    confidence: 'low',
    _scan: true,
    _scanTimestamp: Date.now(),
    _imageExtraction: true
  };
  result.allAmounts = [
    result.totalBilled,
    result.patientBalance,
    result.insurancePaid,
    result.adjustmentAmount
  ].filter(amount => amount !== null);
  const counts = cptCodes.reduce((map, code) => {
    map[code] = (map[code] || 0) + 1;
    return map;
  }, {});
  result.duplicateCodes = Object.keys(counts).filter(code => counts[code] > 1);
  result.hasDuplicateCodes = result.duplicateCodes.length > 0;
  const confidenceSignals = [
    !!result.provider,
    result.totalBilled !== null || result.patientBalance !== null,
    !!result.serviceDate,
    lineItems.length > 0
  ].filter(Boolean).length;
  result.confidence = confidenceSignals >= 3 ? 'high' : confidenceSignals >= 2 ? 'medium' : 'low';
  return result;
}

function parseModelJson(text) {
  const cleaned = String(text || '')
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw error;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = await readBody(req);
    const images = Array.isArray(body.images) ? body.images : [];
    if (!images.length || images.length > MAX_IMAGES) {
      return res.status(400).json({ ok: false, error: `Provide between 1 and ${MAX_IMAGES} bill images` });
    }

    const parsedImages = images.map(image => parseDataUrl(image && image.dataUrl));
    if (parsedImages.some(image => !image)) {
      return res.status(400).json({ ok: false, error: 'Only normalized JPEG or PNG images are accepted' });
    }
    const requestBytes = Buffer.byteLength(JSON.stringify(body), 'utf8');
    if (requestBytes > MAX_REQUEST_BYTES) {
      return res.status(413).json({ ok: false, error: 'Upload is too large to read' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ ok: false, error: 'Document reading is temporarily unavailable' });
    }

    const prompt = `Read the attached medical bill or EOB images carefully. Return ONLY valid JSON and never guess.

Extract visible document facts using this exact shape:
{
  "provider": string or null,
  "serviceDate": string or null,
  "totalBilled": number or null,
  "patientBalance": number or null,
  "insurancePaid": number or null,
  "adjustmentAmount": number or null,
  "claimNumber": string or null,
  "insuranceName": string or null,
  "state": two-letter state code or "",
  "cptCodes": string[],
  "lineItems": [{"code": string, "modifier": string, "billedAmount": number, "shortDescription": string}],
  "denialDetected": boolean,
  "financialAssistanceDetected": boolean,
  "rawText": string
}

Rules:
- Examine every provided page together.
- Use labeled totals. Do not use a random line-item amount as the bill total.
- Include a line item only when both its CPT or HCPCS code and billed dollar amount are visible.
- Preserve repeated line items instead of deduplicating them.
- Do not infer a code, amount, provider, date, insurer, or state that is not visible.
- rawText should be a concise transcription of visible billing facts and line items, not commentary.
- Do not provide legal, medical, or financial advice.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);
    let response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 3000,
          temperature: 0,
          messages: [{
            role: 'user',
            content: parsedImages.map(image => ({
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mediaType,
                data: image.data
              }
            })).concat([{ type: 'text', text: prompt }])
          }]
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('[api/extract-bill] Anthropic request failed', {
        status: response.status,
        type: payload && payload.error && payload.error.type
      });
      return res.status(502).json({ ok: false, error: 'The document could not be read. Please try again.' });
    }

    const text = Array.isArray(payload.content)
      ? payload.content.filter(part => part && part.type === 'text').map(part => part.text || '').join('')
      : '';
    const data = normalizeResult(parseModelJson(text), parsedImages.length);
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    if (error && error.name === 'AbortError') {
      return res.status(504).json({ ok: false, error: 'Document reading timed out. Please try again.' });
    }
    const status = error && error.code === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
    console.error('[api/extract-bill] Request failed', { message: error && error.message });
    return res.status(status).json({ ok: false, error: status === 413 ? error.message : 'The document could not be read.' });
  }
};
