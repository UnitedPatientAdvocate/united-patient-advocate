const DEFAULT_MODEL = (process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest').trim();
const PREFERRED_MODELS = [
  'claude-3-5-sonnet-latest',
  'claude-3-7-sonnet-latest',
  'claude-3-5-haiku-latest',
  'claude-sonnet-4-0',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-haiku-20240307'
];

const PROMPT_CONFIGS = {
  free_preview: {
    maxTokens: 1800,
    buildPrompt: intake => `You are the consumer-guidance AI engine behind United Patient Advocate. Create a concise FREE PREVIEW teaser for a billing review submission and return ONLY valid JSON.

Framing rules:
- Use observational, careful language.
- Do not accuse providers, insurers, or staff.
- Do not guarantee savings, corrections, or outcomes.
- Do not present legal representation or medical advice.
- Do not provide full scripts, full letters, full tactics, escalation playbooks, or detailed solutions.
- Keep the total response concise, generally under 600 words across all JSON string values.
- Make the preview useful but intentionally incomplete, with thoughtful cliffhanger language that points toward the premium Complete Billing Review.

Patient submission:
${formatIntake(intake)}

Return exactly this JSON structure with no markdown:
{
  "generationMode": "free_preview",
  "summary": {
    "riskLevel": "LOW | MEDIUM | HIGH",
    "severityLabel": "Short screening label",
    "estimatedSavingsMin": "",
    "estimatedSavingsMax": "",
    "errorsFound": ["One carefully worded teaser finding only"],
    "keyFindings": "2-3 concise sentences summarizing the initial screening without giving away full tactics."
  },
  "preview": {
    "screeningHeadline": "Short premium teaser headline",
    "teaserFinding": "One visible personalized teaser finding only.",
    "cliffhanger": "Short sentence explaining that the deeper Complete Billing Review contains the rest of the personalized analysis.",
    "lockedModuleReferences": [
      "Provider-Specific Negotiation Brief",
      "Recovery Probability Score",
      "Escalation Hierarchy",
      "Personalized Scripts",
      "30-Day Action Review"
    ]
  },
  "paidDossier": null
}`
  },
  paid_dossier: {
    maxTokens: 9000,
    buildPrompt: intake => `You are the premium consumer-guidance AI engine behind United Patient Advocate. Create a full PAID Complete Billing Review from the submitted billing information and return ONLY valid JSON.

Framing rules:
- Use observational, careful language.
- Do not accuse providers, insurers, or staff.
- Do not guarantee savings, corrections, negotiations, or outcomes.
- Do not present legal representation, medical advice, or insurance adjudication.
- Provide practical, professional consumer guidance in a premium review format.
- Target roughly 1,800-3,500 words across the review content.
- Include deep but measured analysis, not sensational claims.

Patient submission:
${formatIntake(intake)}

Return exactly this JSON structure with no markdown:
{
  "generationMode": "paid_dossier",
  "summary": {
    "riskLevel": "LOW | MEDIUM | HIGH",
    "severityLabel": "Short screening label",
    "estimatedSavingsMin": "",
    "estimatedSavingsMax": "",
    "errorsFound": ["Observation 1", "Observation 2", "Observation 3"],
    "keyFindings": "Concise premium overview of the strongest review themes."
  },
  "paidDossier": {
    "executiveOverview": "Premium overview paragraph or two.",
    "billingPatternAnalysis": ["Structured observation 1", "Structured observation 2", "Structured observation 3"],
    "providerSpecificObservations": ["Observation 1", "Observation 2"],
    "negotiationContext": ["Measured negotiation consideration 1", "Measured negotiation consideration 2"],
    "escalationHierarchy": ["Step or channel 1", "Step or channel 2", "Step or channel 3"],
    "recoveryProbability": {
      "label": "LOW | MODERATE | STRONG",
      "rationale": "Careful, non-guaranteeing rationale."
    },
    "financialAssistanceContext": ["Relevant context 1", "Relevant context 2"],
    "communicationGuidance": ["Guidance 1", "Guidance 2", "Guidance 3"],
    "thirtyDayActionPlan": [
      {"step":1,"title":"Title","description":"Description","timeframe":"TODAY","powerTip":"Measured practical tip"},
      {"step":2,"title":"Title","description":"Description","timeframe":"Within 2 Days","powerTip":"Measured practical tip"},
      {"step":3,"title":"Title","description":"Description","timeframe":"Within 1 Week","powerTip":"Measured practical tip"},
      {"step":4,"title":"Title","description":"Description","timeframe":"Within 2 Weeks","powerTip":"Measured practical tip"},
      {"step":5,"title":"Title","description":"Description","timeframe":"Day 30","powerTip":"Measured practical tip"}
    ]
  },
  "disputeLetter": "Full personalized dispute/documentation letter in a professional consumer-guidance tone.",
  "phoneScript": "Full personalized call script with careful, non-accusatory phrasing.",
  "actionPlan": [
    {"step":1,"title":"Title","description":"Description","timeframe":"TODAY","powerTip":"Measured practical tip"},
    {"step":2,"title":"Title","description":"Description","timeframe":"Within 2 Days","powerTip":"Measured practical tip"},
    {"step":3,"title":"Title","description":"Description","timeframe":"Within 1 Week","powerTip":"Measured practical tip"},
    {"step":4,"title":"Title","description":"Description","timeframe":"Within 2 Weeks","powerTip":"Measured practical tip"},
    {"step":5,"title":"Title","description":"Description","timeframe":"Day 30","powerTip":"Measured practical tip"}
  ],
  "yourRights": [
    "Consumer guidance item 1: Explanation",
    "Consumer guidance item 2: Explanation",
    "Consumer guidance item 3: Explanation",
    "Consumer guidance item 4: Explanation",
    "Consumer guidance item 5: Explanation"
  ]
}`
  }
};

function getEnvValue(name) {
  const direct = process.env[name];
  if (typeof direct === 'string' && direct.trim()) return direct.trim().replace(/^['\"]|['\"]$/g, '');

  const normalizedName = name.toUpperCase();
  const match = Object.entries(process.env).find(([key, value]) => (
    key.trim().toUpperCase() === normalizedName && typeof value === 'string' && value.trim()
  ));
  return match ? match[1].trim().replace(/^['\"]|['\"]$/g, '') : '';
}

function getAnthropicApiKey() {
  return getEnvValue('ANTHROPIC_API_KEY');
}

function normalizeIntake(input = {}) {
  return {
    providerName: input.providerName || 'Unknown Hospital',
    totalBilled: input.totalBilled || '',
    amountOwed: input.amountOwed || input.totalBilled || '',
    insurance: input.hasInsurance ? (input.insuranceType || 'unspecified') : 'none',
    visitReason: input.visitReason || '',
    servicesReceived: input.servicesReceived || '',
    stayDuration: input.stayDuration || '',
    billStatus: input.billStatus || '',
    specificConcerns: input.specificConcerns || 'bill seems too high'
  };
}

function formatIntake(intake) {
  return [
    `- Provider: ${intake.providerName}`,
    `- Total billed: $${intake.totalBilled}`,
    `- Amount owed: $${intake.amountOwed}`,
    `- Insurance: ${intake.insurance}`,
    `- Reason for visit: ${intake.visitReason}`,
    `- Services received: ${intake.servicesReceived}`,
    `- Visit type: ${intake.stayDuration}`,
    `- Bill status: ${intake.billStatus}`,
    `- Specific concerns: ${intake.specificConcerns}`
  ].join('\n');
}

function buildStructuredRequest(body = {}) {
  const generationMode = body.generationMode || 'free_preview';
  const config = PROMPT_CONFIGS[generationMode];
  if (!config) return null;

  const intake = normalizeIntake(body.intake || {});
  return {
    generationMode,
    maxTokens: Number(body.max_tokens) || config.maxTokens,
    messages: [{ role: 'user', content: config.buildPrompt(intake) }]
  };
}

function normalizeMessages(messages = []) {
  return messages.map(message => ({
    role: message.role,
    content: typeof message.content === 'string'
      ? message.content
      : Array.isArray(message.content)
        ? message.content
        : String(message.content ?? '')
  }));
}

async function readBody(req) {
  if (req.body && typeof req.body !== 'string') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function listAvailableModels(apiKey) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    });

    if (!response.ok) {
      console.warn('[api/analyze] Could not list Anthropic models', { status: response.status });
      return [];
    }

    const data = await response.json();
    return Array.isArray(data?.data) ? data.data.map(model => model.id).filter(Boolean) : [];
  } catch (error) {
    console.warn('[api/analyze] Model list request failed', { message: error?.message });
    return [];
  }
}

async function buildModelCandidates(apiKey, requestedModel) {
  const configuredModel = getEnvValue('ANTHROPIC_MODEL');
  if (configuredModel) return [configuredModel];

  const availableModels = await listAvailableModels(apiKey);
  const preferred = [...new Set([requestedModel, DEFAULT_MODEL, ...PREFERRED_MODELS].filter(Boolean))];

  if (availableModels.length) {
    const availableSet = new Set(availableModels);
    const preferredAvailable = preferred.filter(model => availableSet.has(model));
    return preferredAvailable.length ? preferredAvailable : availableModels;
  }

  return preferred;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    console.error('[api/analyze] Missing ANTHROPIC_API_KEY runtime environment variable', {
      hasAnthropicModel: Boolean(getEnvValue('ANTHROPIC_MODEL')),
      envKeyDetected: Object.keys(process.env).some(key => key.trim().toUpperCase() === 'ANTHROPIC_API_KEY')
    });
    return res.status(500).json({ error: 'Server API key is not configured' });
  }

  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid JSON request body' });
  }

  const structuredRequest = buildStructuredRequest(body);
  const outbound = {
    model: (body?.model || DEFAULT_MODEL).trim(),
    max_tokens: structuredRequest?.maxTokens || Number(body?.max_tokens) || 4000,
    messages: normalizeMessages(structuredRequest?.messages || (Array.isArray(body?.messages) ? body.messages : []))
  };

  if (!outbound.messages.length) {
    return res.status(400).json({ error: 'Missing messages array or structured generation input' });
  }

  const sendToAnthropic = async requestBody => {
    console.log('[api/analyze] Anthropic request summary', {
      generationMode: structuredRequest?.generationMode || 'legacy_messages',
      model: requestBody.model,
      max_tokens: requestBody.max_tokens,
      messages: requestBody.messages.map(message => ({
        role: message.role,
        contentType: Array.isArray(message.content) ? 'blocks' : typeof message.content,
        contentLength: Array.isArray(message.content) ? message.content.length : message.content.length
      }))
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    return { response, data };
  };

  const modelCandidates = await buildModelCandidates(apiKey, outbound.model);

  let response;
  let data;
  for (const model of modelCandidates) {
    ({ response, data } = await sendToAnthropic({ ...outbound, model }));

    const modelNotFound = response.status === 404
      && data?.error?.type === 'not_found_error'
      && /model/i.test(data?.error?.message || '');

    if (!modelNotFound || getEnvValue('ANTHROPIC_MODEL')) break;

    console.warn('[api/analyze] Model unavailable, trying next model', {
      model,
      next: modelCandidates[modelCandidates.indexOf(model) + 1]
    });
  }

  if (!response.ok) {
    const modelUnavailable = response.status === 404
      && data?.error?.type === 'not_found_error'
      && /model/i.test(data?.error?.message || '');

    console.error('[api/analyze] Anthropic error', {
      status: response.status,
      modelUnavailable,
      modelTried: response.status === 404 ? modelCandidates : outbound.model,
      data
    });

    return res.status(502).json({
      error: modelUnavailable ? 'Anthropic model unavailable' : 'Anthropic request failed',
      code: modelUnavailable ? 'anthropic_model_unavailable' : 'anthropic_request_failed',
      userMessage: modelUnavailable
        ? 'The analysis model is temporarily unavailable for this Anthropic account. Please try again shortly.'
        : 'The analysis request could not be completed. Please try again in a moment.',
      upstreamStatus: response.status,
      upstream: data
    });
  }

  return res.status(response.status).json({
    ...data,
    generationMode: structuredRequest?.generationMode || 'legacy_messages'
  });
}
