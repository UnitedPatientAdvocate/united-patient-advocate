const fs = require('node:fs');
const path = require('node:path');

const CLFS_DATA_PATH = path.join(__dirname, 'data', 'cms-clfs-2026.json');
const CLFS_SOURCE = 'CMS CLFS 2026';
const CLFS_UNAVAILABLE_REASON = 'benchmark unavailable \u2014 not a CLFS lab code';
let clfsCache = null;

const PROMPT_CONFIGS = {
  free_preview: {
    maxTokens: 700,
    buildPrompt: intake => `Return ONLY compact valid JSON for a FREE medical-bill preview. No markdown. No raw newlines inside strings. Keep all text short.

Rules:
- Careful consumer-guidance language only.
- Do not accuse anyone or promise savings/outcomes.
- Do not provide full scripts, letters, or tactics.
- Output under 220 words total.
- Extract lineItems only when both a code and billed amount are visible in the bill text. Each line item must contain only code, shortDescription, and billedAmount. Do not include rates, Medicare rates, benchmark rates, percentages, sources, or guessed amounts.
- If RAW BILL TEXT is provided below, use the actual charges, CPT codes, amounts, and line items from it to make findings specific and real — not generic.

Patient submission:
${formatIntake(intake)}

JSON schema:
{
  "generationMode": "free_preview",
  "summary": {
    "riskLevel": "LOW | MEDIUM | HIGH",
    "severityLabel": "Short label",
    "estimatedSavingsMin": "",
    "estimatedSavingsMax": "",
    "errorsFound": ["One cautious teaser finding referencing specific charges/codes from the bill if available"],
    "keyFindings": "Two concise sentences referencing specifics from the actual bill."
  },
  "lineItems": [
    {"code":"HCPCS/CPT code exactly as printed, including modifier suffix only if printed","shortDescription":"Short service label from the bill text","billedAmount":123.45}
  ],
  "preview": {
    "screeningHeadline": "Short headline",
    "teaserFinding": "One visible personalized teaser finding referencing the actual bill details.",
    "cliffhanger": "One sentence about what unlocks.",
    "lockedModuleReferences": ["CPT review","Benchmark comparison","Call script","Action plan"]
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
- Do not promise savings, corrections, negotiations, or outcomes.
- Do not present legal representation, medical advice, or insurance adjudication.
- Provide practical, professional consumer guidance in a premium review format.
- Target roughly 1,800-3,500 words across the review content.
- Include deep but measured analysis, not sensational claims.
- Extract lineItems only when both a code and billed amount are visible in the bill text. Each line item must contain only code, shortDescription, and billedAmount. Do not include rates, Medicare rates, benchmark rates, percentages, sources, or guessed amounts.
- Phase 3 case generation must use only extracted/reviewed case data from this request. Do not invent missing dates, diagnoses, plan terms, state rules, or legal rights.
- Every Phase 3 item must cite a sourceType such as "uploaded bill", "patient intake", "CLFS benchmark", "EOB text", or "plan information if provided".
- Keep Phase 3 cautious and review-first: use "may", "can", "possible", "worth checking", and "request written explanation". Do not make legal conclusions or say a billing error is proven.
- JSON validity is critical: escape every quote inside string values, use \\n for line breaks inside long letters/scripts, do not include markdown fences, and do not put raw newline characters inside JSON strings.
- CRITICAL: If RAW BILL TEXT is provided below, your entire analysis MUST be based on the actual charges, CPT codes, line items, dates, amounts, and billing patterns found in that text. Reference specific codes, amounts, and line items by name. This is a real bill — give a real review, not a template.

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
  "lineItems": [
    {"code":"HCPCS/CPT code exactly as printed, including modifier suffix only if printed","shortDescription":"Short service label from the bill text","billedAmount":123.45}
  ],
  "paidDossier": {
    "executiveOverview": "Premium overview paragraph or two.",
    "billingPatternAnalysis": ["Structured observation 1", "Structured observation 2", "Structured observation 3"],
    "providerSpecificObservations": ["Observation 1", "Observation 2"],
    "negotiationContext": ["Measured negotiation consideration 1", "Measured negotiation consideration 2"],
    "escalationHierarchy": ["Step or channel 1", "Step or channel 2", "Step or channel 3"],
    "recoveryProbability": {
      "label": "LOW | MODERATE | STRONG",
      "rationale": "Careful, careful rationale."
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
  "phase3CaseGeneration": {
    "sourceTypes": ["uploaded bill", "patient intake", "CLFS benchmark where matched", "plan information if provided"],
    "patientFindingSummary": "Patient-facing cautious summary that explains what may be worth reviewing and cites source types.",
    "lineItemRiskScoring": [
      {"code":"Code or blank if none","sourceType":"uploaded bill and CLFS benchmark if matched","riskLevel":"LOW | MODERATE | HIGH","reviewReason":"Cautious reason using may/can/possible","patientQuestion":"Question the patient can ask without making a legal conclusion"}
    ],
    "customLetters": [
      {"letterType":"provider_itemized_review","sourceType":"patient intake and uploaded bill","body":"Custom patient-facing letter using cautious language."},
      {"letterType":"insurance_eob_review","sourceType":"plan information if provided and uploaded bill","body":"Custom patient-facing letter using cautious language."}
    ],
    "providerSpecificGuidance": ["Provider-specific guidance using sourceType and cautious wording."],
    "stateSpecificEscalationPaths": ["State-specific escalation guidance if state is known; otherwise say state must be confirmed before relying on deadlines or agencies."],
    "planTypeSpecificLanguage": ["Plan-type-specific wording if plan type is known; otherwise ask the patient to confirm plan type before using plan-specific language."],
    "reviewSafetyNotice": "This review is informational and may identify items worth checking. It is not a legal, medical, insurance, or financial conclusion."
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
  const codeAnalysis = Array.isArray(input.codeAnalysis)
    ? input.codeAnalysis
    : Array.isArray(input.lineItems)
      ? input.lineItems
      : Array.isArray(input._code_analysis)
        ? input._code_analysis
        : [];
  const insurance = input.hasInsurance === false
    ? 'none'
    : (input.insuranceType || input.insurance || input.planType || 'unspecified');
  return {
    providerName: input.providerName || 'Unknown Hospital',
    totalBilled: input.totalBilled || '',
    amountOwed: input.amountOwed || input.totalBilled || '',
    insurance,
    planType: input.planType || input.insuranceType || input.insurance || insurance,
    state: input.state || input.patientState || input.billingState || input.usState || input.locationState || '',
    visitReason: input.visitReason || '',
    servicesReceived: input.servicesReceived || '',
    stayDuration: input.stayDuration || '',
    billStatus: input.billStatus || '',
    specificConcerns: input.specificConcerns || 'bill seems too high',
    billText: input.billText || input.rawText || '',
    codeAnalysis,
    lineItems: codeAnalysis
  };
}

function formatIntake(intake) {
  const lines = [
    `- Provider: ${intake.providerName}`,
    `- Total billed: $${intake.totalBilled}`,
    `- Amount owed: $${intake.amountOwed}`,
    `- Insurance: ${intake.insurance}`,
    `- Plan type: ${intake.planType || intake.insurance || 'unspecified'}`,
    `- State: ${intake.state || 'not provided'}`,
    `- Reason for visit: ${intake.visitReason}`,
    `- Services received: ${intake.servicesReceived}`,
    `- Visit type: ${intake.stayDuration}`,
    `- Bill status: ${intake.billStatus}`,
    `- Specific concerns: ${intake.specificConcerns}`
  ];
  if (intake.billText && intake.billText.trim().length > 20) {
    // Truncate to ~6000 chars to stay within token budget
    const text = intake.billText.trim().slice(0, 6000);
    lines.push(`\nRAW BILL TEXT (extracted from uploaded PDF — use this to identify specific charges, CPT codes, dates, amounts, and billing patterns):\n---\n${text}\n---`);
  }
  if (Array.isArray(intake.codeAnalysis) && intake.codeAnalysis.length) {
    lines.push(`\nDETERMINISTIC EXTRACTED LINE ITEMS (from scanner; use these as source bill line items, but do not add benchmark rates yourself):\n${JSON.stringify(intake.codeAnalysis)}`);
  }
  return lines.join('\n');
}

function buildFallbackPreview(intake) {
  const provider = intake.providerName && intake.providerName !== 'Unknown Hospital'
    ? intake.providerName
    : 'your provider';
  const amount = intake.totalBilled ? `$${intake.totalBilled}` : 'the submitted bill';
  const finding = `The ${amount} bill from ${provider} has enough detail to justify a closer itemized review before you rely on the balance as final.`;

  return {
    generationMode: 'free_preview',
    summary: {
      riskLevel: intake.totalBilled && Number(String(intake.totalBilled).replace(/[^0-9.]/g, '')) > 5000 ? 'HIGH' : 'MEDIUM',
      severityLabel: 'Review recommended',
      estimatedSavingsMin: '',
      estimatedSavingsMax: '',
      errorsFound: [finding],
      keyFindings: 'Your intake suggests the bill should be reviewed against itemized charges, coverage context, and common billing documentation gaps. The full review unlocks the deeper workflow.'
    },
    preview: {
      screeningHeadline: 'A closer billing review may be useful.',
      teaserFinding: finding,
      cliffhanger: 'The Complete Billing Review unlocks benchmark context, prepared questions, call guidance, and next steps.',
      lockedModuleReferences: ['CPT review', 'Benchmark comparison', 'Call script', 'Action plan']
    },
    paidDossier: null
  };
}

function buildStructuredRequest(body = {}) {
  const generationMode = body.generationMode || 'free_preview';
  const config = PROMPT_CONFIGS[generationMode];
  if (!config) return null;

  const intake = normalizeIntake(body.intake || {});
  return {
    generationMode,
    intake,
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

function getAnthropicText(data) {
  return Array.isArray(data?.content) ? data.content.map(part => part?.text || '').join('') : '';
}

function debugPayload(label, value) {
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    console.log(label, {
      length: text?.length || 0,
      preview: text?.slice?.(0, 1200),
      tail: text?.slice?.(-1200)
    });
  } catch {
    console.log(label, value);
  }
}

function loadClfsData() {
  if (clfsCache) return clfsCache;

  try {
    clfsCache = JSON.parse(fs.readFileSync(CLFS_DATA_PATH, 'utf8'));
  } catch (error) {
    console.error('[api/analyze] CLFS benchmark data unavailable', { message: error?.message });
    clfsCache = { metadata: { source: 'CMS CLFS CY2026 Q2V1', year: 2026 } };
  }

  return clfsCache;
}

function normalizeCodeAndModifier(codeValue, explicitModifier = '') {
  const raw = String(codeValue || '').trim().toUpperCase();
  const modifier = String(explicitModifier || '').trim().toUpperCase();
  const match = raw.match(/\b([A-Z0-9]{5})(?:\s*[-/ ]\s*([A-Z0-9]{1,4}))?\b/);

  if (!match) {
    return { code: raw, modifier };
  }

  return {
    code: match[1],
    modifier: modifier || match[2] || ''
  };
}

function parseMoneyAmount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const parsed = Number.parseFloat(String(value || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function roundPercent(value) {
  return Math.round((Number(value) + Number.EPSILON) * 10) / 10;
}

function lookupClfsBenchmark(codeValue, explicitModifier = '') {
  const { code, modifier } = normalizeCodeAndModifier(codeValue, explicitModifier);
  const unavailable = {
    available: false,
    code,
    modifier,
    reason: CLFS_UNAVAILABLE_REASON
  };

  if (!code) return unavailable;

  const data = loadClfsData();
  const record = data[code];
  if (!record) return unavailable;

  const modifierEntry = modifier && record.modifiers && record.modifiers[modifier]
    ? record.modifiers[modifier]
    : null;
  const entry = modifierEntry || record.default;

  if (!entry || typeof entry.rate !== 'number' || !Number.isFinite(entry.rate)) {
    return unavailable;
  }

  return {
    available: true,
    code,
    modifier: entry.modifier || '',
    requestedModifier: modifier,
    source: CLFS_SOURCE,
    benchmarkRate: entry.rate,
    shortDescription: entry.shortDescription || '',
    effectiveDate: entry.effectiveDate || '',
    indicator: entry.indicator || ''
  };
}

function getPayloadLineItems(payload) {
  const candidates = [
    payload?.codeAnalysis,
    payload?.lineItems,
    payload?.paidDossier?.codeAnalysis,
    payload?.paidDossier?.lineItems,
    payload?.summary?.codeAnalysis,
    payload?.summary?.lineItems
  ];

  return candidates.find(candidate => Array.isArray(candidate) && candidate.length) || [];
}

function getRequestLineItems(intake = {}) {
  const candidates = [
    intake?.codeAnalysis,
    intake?.lineItems,
    intake?._code_analysis
  ];

  return candidates.find(candidate => Array.isArray(candidate) && candidate.length) || [];
}

function enrichLineItemWithClfs(item = {}) {
  const codeValue = item.code || item.hcpcs || item.cptCode || item.procedureCode || '';
  const benchmark = lookupClfsBenchmark(codeValue, item.modifier);
  const billedAmount = parseMoneyAmount(item.billedAmount ?? item.amount ?? item.charge);
  const base = {
    code: benchmark.code || String(codeValue || '').trim().toUpperCase(),
    shortDescription: String(item.shortDescription || item.description || '').trim(),
    billedAmount
  };

  if (!benchmark.available) {
    return {
      ...base,
      benchmarkAvailable: false,
      benchmarkStatus: 'unavailable',
      benchmarkUnavailableReason: CLFS_UNAVAILABLE_REASON
    };
  }

  const percentAboveBenchmark = billedAmount != null && benchmark.benchmarkRate > 0
    ? ((billedAmount - benchmark.benchmarkRate) / benchmark.benchmarkRate) * 100
    : null;
  const overchargeAmount = billedAmount != null
    ? Math.max(0, billedAmount - benchmark.benchmarkRate)
    : 0;

  return {
    ...base,
    modifier: benchmark.modifier,
    benchmarkAvailable: true,
    benchmarkStatus: 'verified',
    benchmarkRate: benchmark.benchmarkRate,
    benchmarkDescription: benchmark.shortDescription,
    percentAboveBenchmark: percentAboveBenchmark == null ? null : roundPercent(percentAboveBenchmark),
    overchargeAmount: roundMoney(overchargeAmount),
    source: CLFS_SOURCE
  };
}

function enrichLineItemsWithClfsBenchmarks(lineItems = []) {
  const enriched = Array.isArray(lineItems) ? lineItems.map(enrichLineItemWithClfs) : [];
  const matched = enriched.filter(item => item.benchmarkAvailable).length;
  const total = enriched.length;
  const overchargeTotal = enriched.reduce((sum, item) => sum + (item.benchmarkAvailable ? Number(item.overchargeAmount || 0) : 0), 0);

  return {
    lineItems: enriched,
    coverage: {
      source: CLFS_SOURCE,
      matchedLineItems: matched,
      totalLineItems: total,
      statement: `${matched} of ${total} line items matched a verified Medicare lab benchmark.`
    },
    overchargeTotal: roundMoney(overchargeTotal)
  };
}

function prependUniqueStatement(items, statement) {
  const list = Array.isArray(items) ? items.slice() : [];
  if (!statement || list.some(item => String(item || '').includes(statement))) return list;
  return [statement, ...list];
}

const PHASE3_REVIEW_NOTICE = 'This review is informational and may identify items worth checking. It is not a legal, medical, insurance, or financial conclusion.';

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function uniqueNonEmptyList(values = [], limit = 0) {
  const seen = new Set();
  const list = [];

  values.flat().forEach(value => {
    const text = cleanText(value);
    if (!text) return;

    const key = text.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    list.push(text);
  });

  return limit > 0 ? list.slice(0, limit) : list;
}

function formatMoneyLabel(value) {
  const amount = parseMoneyAmount(value);
  if (amount == null) return '';

  const rounded = roundMoney(amount);
  return `$${rounded.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2
  })}`;
}

function getKnownState(intake = {}) {
  return cleanText(intake.state || intake.patientState || intake.billingState || intake.usState || intake.locationState);
}

function getPlanType(intake = {}) {
  return cleanText(intake.planType || intake.insurance || intake.insuranceType);
}

function buildPhase3SourceTypes(payload, intake, lineItems) {
  const sourceTypes = ['patient intake'];
  if (cleanText(intake.billText) || lineItems.length) sourceTypes.push('uploaded bill');
  if (lineItems.some(item => item?.benchmarkAvailable)) sourceTypes.push('CLFS benchmark');
  if (getPlanType(intake) && !/^(none|unspecified)$/i.test(getPlanType(intake))) sourceTypes.push('plan information if provided');
  if (getKnownState(intake)) sourceTypes.push('patient intake state');
  if (Array.isArray(payload?.summary?.errorsFound) && payload.summary.errorsFound.length) sourceTypes.push('reviewed case summary');
  return uniqueNonEmptyList(sourceTypes);
}

function getLineRiskLevel(item = {}) {
  const billedAmount = parseMoneyAmount(item.billedAmount);
  const percentAboveBenchmark = Number(item.percentAboveBenchmark);
  const overchargeAmount = parseMoneyAmount(item.overchargeAmount);

  if (item.benchmarkAvailable) {
    if (Number.isFinite(percentAboveBenchmark) && percentAboveBenchmark >= 200) return 'HIGH';
    if (overchargeAmount != null && overchargeAmount >= 500) return 'HIGH';
    if (Number.isFinite(percentAboveBenchmark) && percentAboveBenchmark >= 50) return 'MODERATE';
    if (overchargeAmount != null && overchargeAmount >= 100) return 'MODERATE';
    return 'LOW';
  }

  if (billedAmount != null && billedAmount >= 1000) return 'HIGH';
  if (billedAmount != null && billedAmount >= 250) return 'MODERATE';
  return 'LOW';
}

function buildLineItemRiskScoring(lineItems = []) {
  return lineItems.map(item => {
    const code = cleanText(item.code);
    const billedLabel = formatMoneyLabel(item.billedAmount) || 'the billed amount';
    const benchmarkLabel = item.benchmarkAvailable ? formatMoneyLabel(item.benchmarkRate) : '';
    const percent = Number(item.percentAboveBenchmark);
    const percentText = Number.isFinite(percent) ? `${roundPercent(percent)}%` : '';
    const sourceType = item.benchmarkAvailable
      ? 'uploaded bill and CLFS benchmark'
      : 'uploaded bill; no verified CLFS benchmark';

    const reviewReason = item.benchmarkAvailable
      ? `This line may be worth checking because ${billedLabel} can be compared with a verified CLFS lab benchmark${benchmarkLabel ? ` of ${benchmarkLabel}` : ''}${percentText ? `, about ${percentText} above benchmark` : ''}.`
      : `This line may need a documentation review because it did not match the CLFS lab benchmark table, so no Medicare lab-rate conclusion should be made from this review.`;

    return {
      code,
      shortDescription: cleanText(item.shortDescription || item.benchmarkDescription),
      billedAmount: parseMoneyAmount(item.billedAmount),
      benchmarkAvailable: Boolean(item.benchmarkAvailable),
      benchmarkRate: item.benchmarkAvailable ? parseMoneyAmount(item.benchmarkRate) : null,
      percentAboveBenchmark: item.benchmarkAvailable && Number.isFinite(percent) ? roundPercent(percent) : null,
      sourceType,
      riskLevel: getLineRiskLevel(item),
      reviewReason,
      patientQuestion: item.benchmarkAvailable
        ? `Can you provide a written explanation for how code ${code || 'this line item'} was priced and whether the billed amount is correct for my account?`
        : `Can you provide the itemized documentation and EOB support for ${code || 'this line item'} so I can understand how it was reviewed?`
    };
  });
}

function buildPatientFindingSummary(payload, lineItems) {
  const matched = lineItems.filter(item => item.benchmarkAvailable).length;
  const total = lineItems.length;
  const risk = cleanText(payload?.summary?.riskLevel || payload?.summary?.severityLabel || 'review needed');

  if (!total) {
    return `Source type: patient intake. This case may still benefit from an itemized review, but no CPT/HCPCS line items were reliably extracted, so the packet should avoid benchmark conclusions until the bill or EOB is reviewed. Overall review level: ${risk}.`;
  }

  if (matched) {
    return `Source type: uploaded bill and CLFS benchmark. ${matched} of ${total} line items matched a verified Medicare lab benchmark, which can help identify possible pricing questions while the remaining lines should be reviewed through the itemized bill, EOB, and provider documentation. Overall review level: ${risk}.`;
  }

  return `Source type: uploaded bill. ${total} line items were extracted, but none matched a verified CLFS lab benchmark, so this review should focus on documentation, duplicate-charge checks, EOB comparison, and written explanations rather than Medicare lab-rate conclusions. Overall review level: ${risk}.`;
}

function buildProviderSpecificGuidance(intake, payload) {
  const provider = cleanText(intake.providerName) && intake.providerName !== 'Unknown Hospital'
    ? intake.providerName
    : 'the provider billing office';
  const total = formatMoneyLabel(intake.amountOwed || intake.totalBilled);

  return uniqueNonEmptyList([
    `Source type: patient intake. Contact ${provider} and request a written itemized statement, coding review, and documentation for any line that may look duplicated, unclear, or unsupported by the visit records.`,
    total ? `Source type: patient intake. Because the account balance is listed as ${total}, the patient can ask whether collections activity can be paused while a written billing review is pending.` : '',
    `Source type: reviewed case summary. Ask ${provider} to respond in writing and to identify the department or representative responsible for billing corrections, financial assistance, and account notes.`,
    `Source type: uploaded bill if provided. Keep the request focused on verification and documentation; avoid claiming that an error is proven before the provider reviews the account.`
  ]);
}

function buildStateSpecificEscalationPaths(intake) {
  const state = getKnownState(intake);

  if (!state) {
    return [
      'Source type: patient intake. State was not provided, so state-specific escalation paths, deadlines, and agencies should be confirmed before the patient relies on them.',
      'Source type: patient intake. If the provider or plan does not respond in writing, the patient can ask which patient relations, billing review, financial assistance, or member services office handles unresolved billing concerns.'
    ];
  }

  return [
    `Source type: patient intake state. Because the state is listed as ${state}, the patient may confirm the correct state insurance department, consumer assistance office, or hospital billing-review channel before escalating.`,
    `Source type: patient intake state. If a written response is not provided, the patient can ask the provider or plan which ${state} complaint, appeal, or patient advocate pathway applies to this type of billing concern.`,
    'Source type: patient intake state. This review does not determine legal deadlines; the patient should confirm any timing rules directly from the EOB, plan documents, provider notices, or the appropriate agency.'
  ];
}

function buildPlanTypeSpecificLanguage(intake) {
  const planType = getPlanType(intake);
  const lower = planType.toLowerCase();

  if (!planType || /^none|unspecified$/i.test(planType)) {
    return [
      'Source type: patient intake. Plan type was not confirmed, so the patient should verify whether this is commercial insurance, Medicare, Medicare Advantage, Medicaid, self-pay, or another arrangement before using plan-specific appeal language.',
      'Source type: patient intake. Until plan type is confirmed, letters should ask for the EOB, itemized bill, coding basis, and written explanation without assuming a specific appeal pathway.'
    ];
  }

  if (lower.includes('medicare advantage')) {
    return [
      `Source type: plan information if provided. Because the plan appears to be ${planType}, the patient can ask for the EOB, reconsideration instructions, network billing basis, and any plan-specific review forms.`,
      'Source type: plan information if provided. The language should say the charge may need review and should request written plan reasoning, not a legal conclusion.'
    ];
  }

  if (lower.includes('medicare')) {
    return [
      `Source type: plan information if provided. Because the plan appears to involve ${planType}, the patient can ask for the Medicare Summary Notice or EOB section that supports each disputed charge.`,
      'Source type: plan information if provided. The patient should confirm the proper Medicare or supplemental-plan review channel before submitting final appeal language.'
    ];
  }

  if (lower.includes('medicaid')) {
    return [
      `Source type: plan information if provided. Because the plan appears to involve ${planType}, the patient can ask member services or the state program contact how billing-review or appeal questions should be submitted.`,
      'Source type: plan information if provided. The request should focus on written explanation, covered-service status, and documentation rather than asserting an entitlement.'
    ];
  }

  if (lower.includes('self') || lower.includes('none') || lower.includes('uninsured')) {
    return [
      `Source type: patient intake. Because the case appears to be ${planType}, the patient can ask for self-pay discounts, financial assistance screening, charity-care review where available, and an itemized written explanation.`,
      'Source type: patient intake. The patient should request a billing hold during review if the provider allows it.'
    ];
  }

  return [
    `Source type: plan information if provided. Because the plan is listed as ${planType}, the patient can ask the insurer or administrator for the EOB, member handbook section, and written appeal or reconsideration instructions that apply to this charge.`,
    'Source type: plan information if provided. The letter should use cautious language such as "may need review" and "please explain in writing" instead of asserting that coverage is owed.'
  ];
}

function buildCustomLetters(intake, payload, lineItemRiskScoring) {
  const provider = cleanText(intake.providerName) && intake.providerName !== 'Unknown Hospital'
    ? intake.providerName
    : 'Billing Department';
  const planType = getPlanType(intake) || 'my plan';
  const issueLines = lineItemRiskScoring.slice(0, 5).map(item => {
    const code = item.code ? `Code ${item.code}` : 'A reviewed line item';
    return `- ${code}: ${item.reviewReason}`;
  });
  const issueText = issueLines.length
    ? issueLines.join('\n')
    : '- The submitted bill may need a written itemized review before the balance is treated as final.';
  const summary = cleanText(payload?.summary?.keyFindings) || buildPatientFindingSummary(payload, getPayloadLineItems(payload));

  return [
    {
      letterType: 'provider_itemized_review',
      title: 'Provider itemized billing review request',
      sourceType: 'patient intake and uploaded bill',
      body: `Dear ${provider},\n\nI am requesting a written itemized review of my account. Based on the bill information I have available, the following items may need explanation or documentation:\n${issueText}\n\nPlease provide an itemized statement, coding basis, relevant account notes, and any correction if your review confirms a duplicate, unsupported, or incorrectly billed entry. This request is for review and documentation only and does not make a legal conclusion.\n\nSincerely,\nPatient`
    },
    {
      letterType: 'insurance_eob_review',
      title: 'Insurance or plan EOB review request',
      sourceType: 'plan information if provided and uploaded bill',
      body: `To ${planType} Member Services,\n\nI am requesting a written explanation of benefits review for the charges connected to this bill. The current review summary says: ${summary}\n\nPlease identify the EOB language, coverage basis, coding explanation, and appeal or reconsideration instructions that may apply. I am asking for written clarification and correction if your review confirms an issue.\n\nSincerely,\nPatient`
    },
    {
      letterType: 'provider_follow_up',
      title: 'Provider follow-up if no written response',
      sourceType: 'patient intake, uploaded bill, and reviewed case summary',
      body: `Dear ${provider},\n\nI am following up on my request for a written billing review. Please confirm the status of the review, whether collections activity can remain paused while the account is being checked, and which department handles unresolved billing questions.\n\nThis follow-up is intended to document the request and keep the account review moving. It does not assert that an error has been legally determined.\n\nSincerely,\nPatient`
    }
  ];
}

function attachPhase3CaseGenerationToPayload(payload, intake = {}) {
  const isPaidDossier = payload?.generationMode === 'paid_dossier'
    || (payload?.paidDossier && typeof payload.paidDossier === 'object');
  if (!payload || typeof payload !== 'object' || !isPaidDossier) return payload;

  const lineItems = getPayloadLineItems(payload);
  const existing = payload.phase3CaseGeneration && typeof payload.phase3CaseGeneration === 'object'
    ? payload.phase3CaseGeneration
    : payload.paidDossier?.phase3CaseGeneration && typeof payload.paidDossier.phase3CaseGeneration === 'object'
      ? payload.paidDossier.phase3CaseGeneration
      : {};
  const defaultRiskScoring = buildLineItemRiskScoring(lineItems);
  const existingSummary = cleanText(existing.patientFindingSummary);
  const lineItemRiskScoring = defaultRiskScoring;
  const phase3 = {
    ...existing,
    sourceTypes: Array.isArray(existing.sourceTypes) && existing.sourceTypes.length
      ? uniqueNonEmptyList(existing.sourceTypes)
      : buildPhase3SourceTypes(payload, intake, lineItems),
    patientFindingSummary: /source type/i.test(existingSummary)
      ? existingSummary
      : buildPatientFindingSummary(payload, lineItems),
    lineItemRiskScoring,
    customLetters: buildCustomLetters(intake, payload, lineItemRiskScoring),
    providerSpecificGuidance: buildProviderSpecificGuidance(intake, payload),
    stateSpecificEscalationPaths: buildStateSpecificEscalationPaths(intake),
    planTypeSpecificLanguage: buildPlanTypeSpecificLanguage(intake),
    reviewSafetyNotice: cleanText(existing.reviewSafetyNotice) || PHASE3_REVIEW_NOTICE
  };

  const next = {
    ...payload,
    phase3CaseGeneration: phase3
  };

  if (next.paidDossier && typeof next.paidDossier === 'object') {
    const riskSummary = lineItemRiskScoring.length
      ? `Line-item risk scoring (Source type: uploaded bill${lineItems.some(item => item?.benchmarkAvailable) ? ' and CLFS benchmark' : ''}): ${lineItemRiskScoring.slice(0, 3).map(item => `${item.code || 'line item'} ${item.riskLevel}`).join(', ')}.`
      : '';
    const billingPatternAnalysis = prependUniqueStatement(
      prependUniqueStatement(next.paidDossier.billingPatternAnalysis, phase3.patientFindingSummary),
      riskSummary
    );

    next.paidDossier = {
      ...next.paidDossier,
      phase3CaseGeneration: phase3,
      patientFindingSummary: phase3.patientFindingSummary,
      lineItemRiskScoring: phase3.lineItemRiskScoring,
      customLetters: phase3.customLetters,
      providerSpecificGuidance: phase3.providerSpecificGuidance,
      stateSpecificEscalationPaths: phase3.stateSpecificEscalationPaths,
      planTypeSpecificLanguage: phase3.planTypeSpecificLanguage,
      reviewSafetyNotice: phase3.reviewSafetyNotice,
      billingPatternAnalysis,
      providerSpecificObservations: uniqueNonEmptyList([
        next.paidDossier.providerSpecificObservations,
        phase3.providerSpecificGuidance
      ]),
      escalationHierarchy: uniqueNonEmptyList([
        next.paidDossier.escalationHierarchy,
        phase3.stateSpecificEscalationPaths
      ]),
      communicationGuidance: uniqueNonEmptyList([
        next.paidDossier.communicationGuidance,
        phase3.planTypeSpecificLanguage
      ])
    };
  }

  return next;
}

function attachClfsBenchmarksToPayload(payload, requestLineItems = [], intake = {}) {
  if (!payload || typeof payload !== 'object') return payload;

  const lineItems = getPayloadLineItems(payload);
  const sourceLineItems = lineItems.length ? lineItems : (Array.isArray(requestLineItems) ? requestLineItems : []);
  if (!sourceLineItems.length) {
    const emptyPayload = { ...payload, codeAnalysis: [] };
    if (emptyPayload.paidDossier && typeof emptyPayload.paidDossier === 'object') {
      emptyPayload.paidDossier = { ...emptyPayload.paidDossier, codeAnalysis: [] };
    }
    return attachPhase3CaseGenerationToPayload(emptyPayload, intake);
  }

  const enriched = enrichLineItemsWithClfsBenchmarks(sourceLineItems);
  const next = {
    ...payload,
    codeAnalysis: enriched.lineItems,
    lineItems: enriched.lineItems,
    clfsBenchmarkCoverage: enriched.coverage,
    clfsOverchargeTotal: enriched.overchargeTotal
  };

  if (next.paidDossier && typeof next.paidDossier === 'object') {
    next.paidDossier = {
      ...next.paidDossier,
      codeAnalysis: enriched.lineItems,
      lineItems: enriched.lineItems,
      benchmarkCoverageStatement: enriched.coverage.statement,
      billingPatternAnalysis: prependUniqueStatement(next.paidDossier.billingPatternAnalysis, enriched.coverage.statement)
    };
  }

  return attachPhase3CaseGenerationToPayload(next, intake);
}

function extractJsonCandidate(raw) {
  const text = String(raw || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const start = text.indexOf('{');
  if (start === -1) return '';

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') inString = true;
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  return '';
}

function attachClfsBenchmarksToAnthropicData(data, requestLineItems = [], intake = {}) {
  const raw = getAnthropicText(data);
  const candidate = extractJsonCandidate(raw);
  if (!candidate) return data;

  try {
    const payload = attachClfsBenchmarksToPayload(JSON.parse(candidate), requestLineItems, intake);
    const text = JSON.stringify(payload);
    return {
      ...data,
      content: Array.isArray(data?.content)
        ? data.content.map((part, index) => index === 0 ? { ...part, text } : { ...part, text: '' })
        : data?.content,
      normalizedPayload: payload
    };
  } catch (error) {
    console.warn('[api/analyze] CLFS benchmark enrichment skipped', { message: error?.message });
    return data;
  }
}

function isAnthropicOverloaded(response, data) {
  return response?.status === 529
    || data?.error?.type === 'overloaded_error'
    || /overload|capacity|temporarily unavailable/i.test(data?.error?.message || '');
}

function sendFallbackPreview(res, intake, reason) {
  const payload = attachClfsBenchmarksToPayload(buildFallbackPreview(intake), getRequestLineItems(intake), intake);
  console.warn('[api/analyze] UPA_DEBUG using local free_preview fallback', { reason });
  return res.status(200).json({
    id: 'upa-free-preview-fallback',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: JSON.stringify(payload) }],
    normalizedPayload: payload,
    generationMode: 'free_preview',
    fallback: true,
    fallbackReason: reason
  });
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
  return [requestedModel].filter(Boolean);
}

async function handler(req, res) {
  const MODEL = 'claude-sonnet-4-20250514'; // hardcoded — do not change
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    console.error('[api/analyze] Missing ANTHROPIC_API_KEY runtime environment variable', {
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
    model: MODEL,
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
    debugPayload('[api/analyze] UPA_DEBUG raw Anthropic response before client parsing', getAnthropicText(data));
    return { response, data };
  };

  const modelCandidates = [MODEL];
  const generationMode = structuredRequest?.generationMode || 'legacy_messages';

  let response;
  let data;
  for (const model of modelCandidates) {
    const attempts = generationMode === 'free_preview' ? 2 : 1;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      ({ response, data } = await sendToAnthropic({ ...outbound, model: MODEL }));
      if (!isAnthropicOverloaded(response, data) || attempt === attempts) break;
      console.warn('[api/analyze] Anthropic overloaded; retrying free_preview request', { model, attempt });
      await new Promise(resolve => setTimeout(resolve, 450 * attempt));
    }

    const modelNotFound = response.status === 404
      && data?.error?.type === 'not_found_error'
      && /model/i.test(data?.error?.message || '');

    if (!modelNotFound) break;

    console.warn('[api/analyze] Model unavailable, trying next model', {
      model,
      next: modelCandidates[modelCandidates.indexOf(model) + 1]
    });
  }

  if (!response.ok) {
    if (generationMode === 'free_preview' && isAnthropicOverloaded(response, data)) {
      return sendFallbackPreview(res, structuredRequest?.intake || normalizeIntake(body.intake || {}), 'anthropic_overloaded');
    }

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

  const responseIntake = structuredRequest?.intake || normalizeIntake(body.intake || {});
  const enrichedData = attachClfsBenchmarksToAnthropicData(data, getRequestLineItems(responseIntake), responseIntake);
  return res.status(response.status).json({
    ...enrichedData,
    generationMode: structuredRequest?.generationMode || 'legacy_messages'
  });
}

module.exports = handler;
