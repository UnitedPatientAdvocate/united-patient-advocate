/* ═══════════════════════════════════════════════════════════════════
   UPA SCAN ENGINE — v1.0
   PDF.js extraction · findings generation · state bridge

   Dependency : PDF.js loaded by 00_upa-scan.html before this script
   Public API : window.UPAScanEngine
   Output     : extractedData object + writes upa.scan.v1 / upa.intake.v1

   Sprint-1 success gate:
     ≥ 70 % of real medical bill PDFs return a dollar amount
     AND either a service date OR a provider name.
     Do NOT build scan UI until this gate passes.
═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */

const UPA_KNOWN_PAYERS = [
  'Medicare','Medicaid','Medigap','Medicare Advantage','Medicare Part',
  'Blue Cross','Blue Shield','BCBS','BlueCross','BlueShield',
  'United Healthcare','UnitedHealthcare','UnitedHealth','UHC',
  'Aetna','Cigna','Humana','Kaiser','Kaiser Permanente',
  'Anthem','Centene','Molina','WellCare','Bright Health',
  'Ambetter','Oscar Health','Oscar',
  'Tricare','TRICARE','Veterans Affairs','Champva','CHAMPVA',
  'CHIP','Multiplan','MultiPlan','Magellan','Beacon Health',
  'Highmark','Independence Blue Cross','Carefirst','CareFirst',
  'HealthMarket','Florida Blue','Horizon BCBS'
];

const PROVIDER_SUFFIXES = /\b(?:hospital|medical\s+cent(?:er|re)|clinic|health(?:\s+system|\s+center|\s+network|\s+plan)?|physicians?|surgery\s+cent(?:er|re)|radiology|emergency|urgent\s+care|imaging|oncology|pediatrics|orthopedics|dermatology|cardiology|neurology|gastroenterology|rehabilitation|rehab|home\s+health|hospice|infusion|dialysis|pharmacy|labs?|laboratory|diagnostics?|associates?|group|practice|institute|foundation|memorial|regional|community|general|university|children'?s|womens?|veterans?|senior|specialty|anesthesia|pathology|surgical|outpatient|inpatient|wound\s+care|therapy)\b/i;

const GENERIC_EXCLUSIONS = /^(?:page\s+\d|statement|invoice|bill|medical\s+bill|account\s+summary|explanation\s+of\s+benefits?|eob|remittance|patient\s+statement|billing\s+statement|date|from|to|provider|facility|dear\s+patient|dear\s+|attention|re:|re\s+|fax|\d{1,2}\/\d{1,2}\/\d{2,4}|p\.?o\.?\s+box|po\s+box|suite|floor|ste\.?\s+\d)/i;

const DENIAL_PATTERNS = [
  /\bdenied\b/i, /\bdenial\b/i, /\bnot\s+covered\b/i,
  /\bnon[- ]covered\b/i, /\bexcluded\b/i,
  /\bbenefit\s+not\s+covered\b/i, /\bservice\s+not\s+covered\b/i,
  /\bnot\s+a\s+covered\s+benefit\b/i, /\bmember\s+not\s+eligible\b/i,
  /\bprior\s+auth(?:orization)?\s+(?:required|not\s+obtained|denied)\b/i,
  /\bnot\s+medically\s+necessary\b/i,
  /\bmedical\s+necessity\s+(?:not\s+met|denied|required)\b/i,
  /\bclaim\s+denied\b/i, /\brequest\s+denied\b/i,
  /\bno\s+benefits\s+(?:are\s+)?available\b/i
];

/* ─────────────────────────────────────────────
   UTILITY
───────────────────────────────────────────── */

function parseAmount(str) {
  if (!str) return null;
  const val = parseFloat(str.replace(/[$,\s]/g, ''));
  return isNaN(val) ? null : val;
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return null;
  return '$' + Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

function formatDateDisplay(raw) {
  if (!raw) return null;
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  // MM/DD/YYYY
  let m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const mo = parseInt(m[1], 10);
    if (mo >= 1 && mo <= 12) return MONTHS[mo-1] + ' ' + parseInt(m[2],10) + ', ' + m[3];
  }
  // YYYY-MM-DD
  m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const mo = parseInt(m[2], 10);
    if (mo >= 1 && mo <= 12) return MONTHS[mo-1] + ' ' + parseInt(m[3],10) + ', ' + m[1];
  }
  // Already readable
  if (/[A-Za-z]/.test(raw)) return raw;
  return raw;
}

function safeProperNounScan(text) {
  if (!text) return null;
  const t = text.trim().replace(/\s+/g, ' ');
  if (t.length < 3) return null;
  if (!/[a-zA-Z]/.test(t)) return null;
  if (GENERIC_EXCLUSIONS.test(t)) return null;
  if (/^(.)\1{4,}/.test(t)) return null;                    // repeated chars
  if (/https?:\/\/|www\./i.test(t)) return null;             // URLs
  if (/^\d+$/.test(t)) return null;                          // pure number
  if (/^\$/.test(t)) return null;                            // dollar amount
  if (t.length > 80) return t.slice(0, 80).trim();
  return t;
}

/* Build line array from PDF.js textContent preserving row structure */
function buildLines(textContent) {
  const LINE_GAP = 6; // px Y-difference threshold for new line
  let lines = [];
  let cur = '';
  let lastY = null;

  textContent.items.forEach(function(item) {
    const str = item.str || '';
    const y   = item.transform ? Math.round(item.transform[5]) : null;

    if (lastY !== null && y !== null && Math.abs(y - lastY) > LINE_GAP) {
      if (cur.trim()) lines.push(cur.trim());
      cur = str;
    } else {
      cur += (cur && !cur.endsWith(' ') && str && !str.startsWith(' ') ? ' ' : '') + str;
    }
    if (y !== null) lastY = y;
    if (item.hasEOL) { if (cur.trim()) lines.push(cur.trim()); cur = ''; lastY = null; }
  });
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

/* ─────────────────────────────────────────────
   EXTRACTION — AMOUNTS
───────────────────────────────────────────── */

function extractAmounts(text) {
  const result = {
    totalBilled: null, patientBalance: null,
    insurancePaid: null, adjustmentAmount: null, allAmounts: []
  };

  /* All dollar amounts — deduplicated, sorted descending */
  const raw = text.match(/\$\s*[\d,]+(?:\.\d{1,2})?/g) || [];
  result.allAmounts = [...new Set(raw.map(parseAmount).filter(v => v && v > 0))].sort((a,b)=>b-a);

  /* Labeled: total billed */
  const totalPat = [
    /(?:total\s+(?:charges?|billed|amount\s+billed|claim\s+amount)|amount\s+billed|billed\s+amount|gross\s+charges?)[:\s]*\$?\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /(?:total\s+amount)[:\s]*\$?\s*([\d,]+(?:\.\d{1,2})?)/gi
  ];
  for (const p of totalPat) {
    let m; while ((m = p.exec(text)) !== null) {
      const v = parseAmount(m[1]);
      if (v && (!result.totalBilled || v > result.totalBilled)) result.totalBilled = v;
    }
  }

  /* Labeled: patient balance */
  const balancePat = [
    /(?:patient\s+(?:responsibility|balance|amount\s+due|total\s+due)|balance\s+due|amount\s+due|your\s+(?:responsibility|balance|share|total)|you\s+owe|total\s+patient\s+(?:responsibility|due))[:\s]*\$?\s*([\d,]+(?:\.\d{1,2})?)/gi,
    /(?:amount\s+you\s+(?:owe|are\s+responsible\s+for|may\s+owe))[:\s]*\$?\s*([\d,]+(?:\.\d{1,2})?)/gi
  ];
  for (const p of balancePat) {
    let m; while ((m = p.exec(text)) !== null) {
      const v = parseAmount(m[1]);
      if (v !== null && v >= 0 && result.patientBalance === null) result.patientBalance = v;
    }
  }

  /* Labeled: insurance paid */
  const insPat = /(?:plan\s+(?:paid|payment|amount)|insurance\s+(?:paid|payment|amount)|benefit\s+(?:paid|payment))[:\s]*\$?\s*([\d,]+(?:\.\d{1,2})?)/gi;
  let im; while ((im = insPat.exec(text)) !== null) {
    const v = parseAmount(im[1]);
    if (v && result.insurancePaid === null) result.insurancePaid = v;
  }

  /* Labeled: adjustment */
  const adjPat = /(?:contractual\s+(?:adjustment|allowance|discount)|provider\s+(?:discount|adjustment|write[- ]?off)|adjustment)[:\s]*\$?\s*([\d,]+(?:\.\d{1,2})?)/gi;
  let am; while ((am = adjPat.exec(text)) !== null) {
    const v = parseAmount(am[1]);
    if (v && result.adjustmentAmount === null) result.adjustmentAmount = v;
  }

  /* Positional fallback — label extraction missed totals */
  if (result.totalBilled === null && result.allAmounts.length > 0) {
    result.totalBilled = result.allAmounts[0];
  }
  if (result.patientBalance === null && result.allAmounts.length > 1) {
    const smallerAmounts = result.allAmounts.filter(a => a < (result.totalBilled || Infinity) && a > 0);
    if (smallerAmounts.length > 0) {
      result.patientBalance = smallerAmounts[smallerAmounts.length - 1]; // smallest = patient portion
    }
  }

  return result;
}

/* ─────────────────────────────────────────────
   EXTRACTION — DATES
───────────────────────────────────────────── */

function extractDates(text) {
  const result = { serviceDate: null, serviceDateRaw: null, allDates: [] };
  const allSet = new Set();

  /* Collect all date-like strings */
  const rawPats = [
    /\b(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/g,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+20\d{2}\b/gi,
    /\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g
  ];
  for (const p of rawPats) { let m; while ((m = p.exec(text)) !== null) allSet.add(m[0]); }
  result.allDates = [...allSet];

  /* Context-aware: service date label */
  const svcPat = /(?:date\s+of\s+service|service\s+date|DOS|date\s+rendered|date\s+of\s+care|date\s+of\s+visit|visit\s+date)\s*[:\-]?\s*((0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(19|20)\d{2}|(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+20\d{2}|(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/gi;
  let sm; while ((sm = svcPat.exec(text)) !== null) {
    if (!result.serviceDateRaw) { result.serviceDateRaw = sm[1]; result.serviceDate = formatDateDisplay(sm[1]); }
  }

  /* Secondary: statement / billing / discharge date */
  if (!result.serviceDateRaw) {
    const secPat = /(?:statement\s+date|billing\s+date|bill\s+date|discharge\s+date|admission\s+date)\s*[:\-]?\s*((0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(19|20)\d{2}|(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+20\d{2})/gi;
    let dm; while ((dm = secPat.exec(text)) !== null) {
      if (!result.serviceDateRaw) { result.serviceDateRaw = dm[1]; result.serviceDate = formatDateDisplay(dm[1]); }
    }
  }

  /* Fallback: most recent plausible date */
  if (!result.serviceDateRaw && result.allDates.length > 0) {
    const now = new Date();
    for (const d of result.allDates) {
      const parsed = new Date(d);
      if (!isNaN(parsed) && parsed <= now && parsed.getFullYear() >= 2018) {
        result.serviceDateRaw = d;
        result.serviceDate    = formatDateDisplay(d);
        break;
      }
    }
  }

  return result;
}

/* ─────────────────────────────────────────────
   EXTRACTION — PROVIDER NAME
───────────────────────────────────────────── */

function extractProvider(text, lines) {
  /* Strategy 1: labeled */
  const labeledPats = [
    /(?:billing\s+(?:provider|facility|entity)|rendering\s+provider|service\s+(?:provider|facility)|facility\s+name|provider\s+name|hospital\s+name|practice\s+name)\s*[:\-]?\s*([^\n\r]{3,80})/gi,
    /(?:bill\s+from|billed\s+by|from)\s*[:\-]?\s*([^\n\r]{3,80})/gi
  ];
  for (const p of labeledPats) {
    let m; while ((m = p.exec(text)) !== null) {
      const c = safeProperNounScan(m[1]);
      if (c && c.length >= 4) return c;
    }
  }

  /* Strategy 2: top-of-document — prefer lines with provider suffixes */
  const topLines = lines.slice(0, 20).filter(l => l.length >= 4 && l.length <= 80);
  for (const line of topLines) {
    const c = safeProperNounScan(line);
    if (c && PROVIDER_SUFFIXES.test(c)) return c;
  }

  /* Strategy 3: first convincing proper-noun line */
  for (const line of topLines) {
    const c = safeProperNounScan(line);
    if (c && c.length >= 5 && /^[A-Z]/.test(c) && !/^\d/.test(c)) return c;
  }

  return null;
}

/* ─────────────────────────────────────────────
   EXTRACTION — CLAIM / ACCOUNT NUMBER
───────────────────────────────────────────── */

function extractClaimNumber(text) {
  const pats = [
    /(?:claim\s+(?:number|#|no\.?|id|num\.?))\s*[:\s#]*([A-Z0-9][A-Z0-9\-]{4,19})\b/gi,
    /(?:account\s+(?:number|#|no\.?|num\.?))\s*[:\s#]*([A-Z0-9][A-Z0-9\-]{4,19})\b/gi,
    /(?:reference\s+(?:number|#|no\.?))\s*[:\s#]*([A-Z0-9][A-Z0-9\-]{4,19})\b/gi,
    /(?:invoice\s+(?:number|#|no\.?))\s*[:\s#]*([A-Z0-9][A-Z0-9\-]{4,19})\b/gi,
    /(?:member\s+(?:id|#|number)|subscriber\s+id)\s*[:\s#]*([A-Z0-9][A-Z0-9\-]{4,19})\b/gi
  ];
  for (const p of pats) {
    let m; while ((m = p.exec(text)) !== null) {
      const v = m[1].trim();
      if (v.length >= 5 && !/^\d{5}$/.test(v) && !/^\d{10}$/.test(v)) return v;
    }
  }
  return null;
}

/* ─────────────────────────────────────────────
   EXTRACTION — INSURANCE
───────────────────────────────────────────── */

function extractInsurance(text) {
  /* Known payer list — fastest, most reliable */
  const lower = text.toLowerCase();
  for (const p of UPA_KNOWN_PAYERS) {
    if (lower.includes(p.toLowerCase())) return p;
  }
  /* Labeled fallback */
  const labeledPat = /(?:insurance\s+(?:company|plan|carrier|name)|payer\s+name|plan\s+name|payor)\s*[:\-]?\s*([^\n\r]{3,60})/gi;
  let m;
  if ((m = labeledPat.exec(text)) !== null) {
    const c = safeProperNounScan(m[1]);
    if (c) return c;
  }
  return null;
}

/* ─────────────────────────────────────────────
   EXTRACTION — CPT CODES
───────────────────────────────────────────── */

function extractCPTCodes(text) {
  const codes = [];
  /* Labeled */
  const labeledPat = /(?:CPT|procedure\s+code|proc\.?\s*code|HCPCS)\s*[:\s]*(\d{5})\b/gi;
  let m; while ((m = labeledPat.exec(text)) !== null) {
    if (!codes.includes(m[1])) codes.push(m[1]);
  }
  /* Standalone 5-digit with billing context */
  if (codes.length === 0) {
    const standalonePat = /\b(\d{5})\b/g;
    while ((m = standalonePat.exec(text)) !== null) {
      const c = m[1];
      if (/^(19|20)\d{2}$/.test(c)) continue; // year
      if (/^\d{5}$/.test(c) && c === '00000') continue;
      const ctx = text.slice(Math.max(0, m.index-80), m.index+80);
      if (/\$[\d,]+/.test(ctx) && !codes.includes(c)) codes.push(c);
    }
  }
  /* Duplicate detection */
  const seen = {}, dupes = [];
  const rawAll = (text.match(/(?:CPT|procedure\s+code)\s*[:\s]*(\d{5})/gi) || [])
    .map(x => { const mm = x.match(/\d{5}/); return mm ? mm[0] : null; })
    .filter(Boolean);
  rawAll.forEach(c => { seen[c] = (seen[c]||0)+1; if (seen[c]===2) dupes.push(c); });

  return { codes: [...new Set(codes)], hasDuplicates: dupes.length > 0, duplicateCodes: dupes };
}

/* ─────────────────────────────────────────────
   DENIAL DETECTION
───────────────────────────────────────────── */

function detectDenial(text) {
  for (const p of DENIAL_PATTERNS) if (p.test(text)) return true;
  return false;
}

/* ─────────────────────────────────────────────
   CONFIDENCE SCORING
───────────────────────────────────────────── */

function scoreConfidence(ext) {
  const bits = [
    !!ext.provider,
    ext.totalBilled !== null || ext.patientBalance !== null,
    !!ext.serviceDate
  ];
  const n = bits.filter(Boolean).length;
  if (n >= 3) return 'high';
  if (n === 2) return 'medium';
  return 'low';
}

/* ─────────────────────────────────────────────
   BILL TYPE INFERENCE
───────────────────────────────────────────── */

function inferBillType(rawText) {
  const t = rawText.toLowerCase();
  if (/explanation\s+of\s+benefits|eob/i.test(t)) return 'EOB';
  if (/hospital|inpatient|outpatient|admission|discharge/i.test(t)) return 'hospital bill';
  if (/emergency|er\b|emergency\s+room/i.test(t)) return 'emergency room bill';
  if (/radiology|imaging|mri|ct\s+scan|x-?ray/i.test(t)) return 'radiology bill';
  if (/lab|laboratory|pathology/i.test(t)) return 'lab bill';
  if (/physician|doctor|office\s+visit|clinic/i.test(t)) return "doctor's office bill";
  return 'medical bill';
}

/* ─────────────────────────────────────────────
   MAIN: extractFromPDF
───────────────────────────────────────────── */

async function extractFromPDF(file) {
  const result = {
    provider: null, serviceDate: null, serviceDateRaw: null,
    totalBilled: null, patientBalance: null,
    insurancePaid: null, adjustmentAmount: null, allAmounts: [],
    claimNumber: null, insuranceName: null,
    cptCodes: [], hasDuplicateCodes: false, duplicateCodes: [],
    denialDetected: false, pageCount: 0,
    rawText: '', lines: [],
    confidence: 'low', _scan: true, _scanTimestamp: Date.now()
  };

  try {
    /* Read file */
    const buf = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload  = e => res(e.target.result);
      r.onerror = () => rej(new Error('FileReader failed'));
      r.readAsArrayBuffer(file);
    });

    /* Load PDF */
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    result.pageCount = pdf.numPages;

    /* Extract text from all pages */
    let allLines = [], fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page   = await pdf.getPage(i);
      const tc     = await page.getTextContent();
      const pLines = buildLines(tc);
      allLines = allLines.concat(pLines);
      fullText += pLines.join('\n') + '\n';
    }
    result.rawText = fullText;
    result.lines   = allLines;

    /* Run all extraction passes */
    const amounts  = extractAmounts(fullText);
    const dates    = extractDates(fullText);
    const cpt      = extractCPTCodes(fullText);

    Object.assign(result, {
      totalBilled:      amounts.totalBilled,
      patientBalance:   amounts.patientBalance,
      insurancePaid:    amounts.insurancePaid,
      adjustmentAmount: amounts.adjustmentAmount,
      allAmounts:       amounts.allAmounts,
      serviceDate:      dates.serviceDate,
      serviceDateRaw:   dates.serviceDateRaw,
      provider:         extractProvider(fullText, allLines),
      claimNumber:      extractClaimNumber(fullText),
      insuranceName:    extractInsurance(fullText),
      cptCodes:         cpt.codes,
      hasDuplicateCodes:cpt.hasDuplicates,
      duplicateCodes:   cpt.duplicateCodes,
      denialDetected:   detectDenial(fullText)
    });

    result.confidence = scoreConfidence(result);

  } catch (err) {
    console.warn('[UPA Scan Engine] Extraction error:', err.message);
    result.confidence = 'failed';
  }

  return result;
}

/* ─────────────────────────────────────────────
   CASE VALUE ESTIMATE
───────────────────────────────────────────── */

function buildCaseValueEstimate(ext) {
  const bal   = ext.patientBalance;
  const total = ext.totalBilled;

  if (bal !== null && bal > 0) {
    const min = Math.max(10, Math.round(bal * 0.40 / 10) * 10);
    return {
      anchor: formatCurrency(bal),
      min:    formatCurrency(min),
      max:    formatCurrency(bal),
      display:formatCurrency(min) + '–' + formatCurrency(bal),
      basis:  'patient_balance'
    };
  }
  if (total !== null && total > 0) {
    const min = Math.max(10, Math.round(total * 0.05 / 10) * 10);
    const max = Math.round(total * 0.18 / 10) * 10;
    return {
      anchor: formatCurrency(total),
      min:    formatCurrency(min),
      max:    formatCurrency(max),
      display:formatCurrency(min) + '–' + formatCurrency(max),
      basis:  'total_billed'
    };
  }
  return { anchor: null, min: null, max: null, display: null, basis: 'none' };
}

/* ─────────────────────────────────────────────
   FINDINGS GENERATION
───────────────────────────────────────────── */

function buildScanFindings(ext) {
  const findings = [];
  const bal      = ext.patientBalance;
  const total    = ext.totalBilled;
  const prov     = ext.provider      || 'your billing provider';
  const ins      = ext.insuranceName || 'your insurance carrier';

  /* ── A: Denial (overrides priority when detected) ── */
  if (ext.denialDetected) {
    findings.push({
      id: 'denial-appeal', priority: 0, severity: 'CRITICAL', gated: false,
      title:  'Coverage Denial Language Detected',
      teaser: 'Your document appears to include denial language connected to ' + ins + '. That does not automatically mean the bill is wrong, but',
      body:   'Your document appears to include denial language connected to ' + ins + '. That does not automatically mean the bill is wrong, but it can be a strong reason to request the EOB basis, denial reason, appeal deadline, and any missing documentation in writing.\n\nMany payer notices include appeal or review deadlines. The prepared request helps you organize the denial language and ask for the specific explanation before accepting the balance as final.',
      letterIncluded: true, letterType: 'appeal',
      injectedValues: { insurance: ins }
    });
  }

  /* ── B: Patient Balance Verification ── */
  if (bal !== null && bal > 50) {
    findings.push({
      id: 'charge-verification', priority: 1,
      severity: bal > 500 ? 'HIGH' : 'MEDIUM', gated: false,
      title:  'Patient Balance Needs Verification',
      teaser: 'A patient balance of ' + formatCurrency(bal) + ' appears on your statement from ' + prov + '. That amount should be',
      body:   'A patient balance of ' + formatCurrency(bal) + ' appears on your statement from ' + prov + '. That amount should be reconciled against itemized charges, insurance payments, contractual adjustments, and remaining patient responsibility before it is treated as final.\n\nThis finding does not mean there is an error or savings. It helps prepare a written request asking the provider or payer to explain how the patient balance was calculated.',
      letterIncluded: true, letterType: 'dispute',
      injectedValues: { amount: bal, provider: prov }
    });
  } else if (total !== null && total > 100) {
    findings.push({
      id: 'charge-verification', priority: 1,
      severity: total > 1000 ? 'HIGH' : 'MEDIUM', gated: false,
      title:  'Charge Amount Needs Itemized Review',
      teaser: 'A total of ' + formatCurrency(total) + ' in charges was identified in your document from ' + prov + '. The next',
      body:   'A total of ' + formatCurrency(total) + ' in charges was identified in your document from ' + prov + '. The next safe step is to compare that amount against itemized line items, payer adjustments, and any EOB or claim explanation.\n\nThis does not prove the amount is incorrect. It gives you a structured written request to confirm what was billed, what was adjusted, and what remains the patient responsibility.',
      letterIncluded: true, letterType: 'dispute',
      injectedValues: { amount: total, provider: prov }
    });
  }

  /* ── C: Balance-to-Total Discrepancy (patient paying > 25 %) ── */
  if (bal !== null && total !== null && total > 0 && bal / total > 0.25) {
    const pct = Math.round((bal / total) * 100);
    findings.push({
      id: 'balance-discrepancy', priority: 2, severity: 'HIGH', gated: true,
      title:  'Patient Responsibility Ratio Needs Review',
      teaser: 'Your patient balance represents ' + pct + '% of total billed charges. That ratio may be normal for some plans, but it',
      body:   'Your patient balance of ' + formatCurrency(bal) + ' represents ' + pct + '% of total billed charges of ' + formatCurrency(total) + '. That ratio may be normal for some plans, but it is worth confirming that ' + ins + ' applied the correct contractual adjustment, coordination of benefits, network handling, and patient-responsibility calculation.\n\nThe prepared request asks for the EOB basis and adjustment history so you can review whether the balance was calculated correctly.',
      letterIncluded: true, letterType: 'eob-verification',
      injectedValues: { balance: bal, total, pct }
    });
  }

  /* ── D: Duplicate Code Flag ── */
  if (ext.hasDuplicateCodes && ext.duplicateCodes.length > 0) {
    const code = ext.duplicateCodes[0];
    findings.push({
      id: 'duplicate-code', priority: 2, severity: 'HIGH', gated: true,
      title:  'Possible Duplicate Billing — Code ' + code,
      teaser: 'Procedure code ' + code + ' appears more than once in your billing document. That may be valid in some cases, but',
      body:   'Procedure code ' + code + ' appears more than once in your billing document. That may be valid in some cases, but it should be checked against the dates, units, modifiers, and service descriptions before the balance is accepted.\n\nThe prepared request asks the provider to identify the line items and documentation supporting each occurrence of the code. If the duplicate is confirmed, you can ask for a corrected statement.',
      letterIncluded: true, letterType: 'duplicate-code',
      injectedValues: { code }
    });
  }

  /* ── E: Procedure Code Verification (no duplicate) ── */
  if (ext.cptCodes.length > 0 && !ext.hasDuplicateCodes) {
    const code = ext.cptCodes[0];
    findings.push({
      id: 'cpt-verification', priority: 3, severity: 'MEDIUM', gated: true,
      title:  'Procedure Code Verification — Code ' + code,
      teaser: 'Procedure code ' + code + ' was identified in your bill. The full review helps you ask whether that code matches',
      body:   'Procedure code ' + code + ' was identified in your bill. The full review helps you ask whether that code matches the service, date, units, and documentation tied to the visit.\n\nThis does not determine whether the code is wrong. It prepares a professional written request for the provider to explain the code basis and any patient-responsibility calculation tied to it.',
      letterIncluded: true, letterType: 'itemized-request',
      injectedValues: { code }
    });
  }

  /* ── F: Multi-Page Complexity ── */
  if (ext.pageCount > 1) {
    findings.push({
      id: 'complex-claim', priority: 4, severity: 'MEDIUM', gated: true,
      title:  'Multi-Page Claim Needs Organized Review',
      teaser: 'Your ' + ext.pageCount + '-page billing document appears to include multiple service lines. More pages usually means more details to',
      body:   'Your ' + ext.pageCount + '-page billing document appears to include multiple service lines. More pages usually means more details to reconcile, including line items, dates, units, payer adjustments, and patient-responsibility calculations.\n\nThe prepared packet helps organize those questions so the provider can respond in writing instead of giving a generic balance explanation.',
      letterIncluded: true, letterType: 'itemized-request',
      injectedValues: { pageCount: ext.pageCount }
    });
  }

  /* ── G: Itemized Billing Request (universal — always included) ── */
  findings.push({
    id: 'itemized-request', priority: 5, severity: 'MEDIUM', gated: true,
    title:  'Itemized Billing Documentation Request',
    teaser: 'A complete itemized statement from ' + prov + ' can help you verify dates, codes, units, adjustments, and the patient balance',
    body:   'A complete itemized statement from ' + prov + ' can help you verify dates, codes, units, adjustments, and the patient balance before you rely on a summary bill alone.\n\nThe prepared request asks for the itemized statement, EOB basis, payer adjustments, and current account status in writing. That paper trail helps you review the bill more safely and respond with specific questions.',
    letterIncluded: true, letterType: 'itemized-request',
    injectedValues: { provider: prov }
  });

  /* Sort by priority; ensure exactly one free finding */
  findings.sort((a, b) => a.priority - b.priority);
  let freeSet = false;
  findings.forEach((f, i) => {
    if (!freeSet && !ext.denialDetected && f.priority <= 2) { f.gated = false; freeSet = true; }
    else if (!freeSet && i === 0) { f.gated = false; freeSet = true; }
    else if (f.priority === 0) { /* denial already free */ }
    else { f.gated = true; }
  });

  return findings.slice(0, 4);
}

/* ─────────────────────────────────────────────
   STATE BRIDGE — write compatible state to storage
───────────────────────────────────────────── */

function writeScanStateToStorage(ext) {
  const ACTIVE_KEY = 'upa.active.case.v1';
  const INTAKE_KEY = 'upa.intake.v1';
  const CHECKOUT_KEY = 'upa.checkout.session.v2';
  const REVIEW_KEY = 'upa.review.session.v1';
  const PAID_KEY = 'upa.paid.results.v2';
  const CASE_KEY = 'upa.case.snapshot.v1';
  const DASHBOARD_KEY = 'upa.dashboard.state.v1';
  const activeAt = new Date().toISOString();
  const caseIdParts = [
    'scan',
    ext._scanTimestamp || Date.now(),
    ext.provider || 'provider',
    ext.claimNumber || ext.serviceDateRaw || ext.serviceDate || 'case'
  ].join('|');
  let hash = 0;
  for (let i = 0; i < caseIdParts.length; i++) hash = ((hash << 5) - hash + caseIdParts.charCodeAt(i)) | 0;
  const caseId = 'upa-scan-' + Math.abs(hash).toString(36) + '-' + String(ext._scanTimestamp || Date.now()).slice(-6);

  /* Full scan data */
  ext._upa_case_id = caseId;
  ext._upa_active_at = activeAt;
  try { sessionStorage.setItem('upa.scan.v1', JSON.stringify(ext)); localStorage.setItem('upa.scan.v1', JSON.stringify(ext)); } catch(e){}

  /* Intake-compatible for existing personalization pipeline.
     Field names must match what upa-case-personalization.js expects. */
  const rawAmount = ext.patientBalance != null ? ext.patientBalance
                  : ext.totalBilled    != null ? ext.totalBilled : null;
  const compat = {
    /* Core fields read by amountInfo() */
    _upa_case_id:     caseId,
    _upa_active_at:   activeAt,
    _upa_source:      'scan',
    active_case_id:   caseId,
    bill_amount:      rawAmount != null ? formatCurrency(rawAmount) : '',
    bill_amount_raw:  '',
    bill_amount_other:rawAmount != null ? formatCurrency(rawAmount) : '',
    /* Extracted amount path — takes priority in amountInfo() when confidence >= 0.5 */
    extracted_bill_amount:           rawAmount != null ? String(rawAmount) : '',
    extracted_bill_amount_confidence: rawAmount != null ? 0.9 : 0,
    /* Structured fields */
    provider:         ext.provider        || '',
    extracted_provider: ext.provider      || '',
    extracted_provider_confidence: ext.provider ? (ext.confidence === 'high' ? 0.85 : 0.65) : 0,
    date_of_service:  ext.serviceDateRaw  || ext.serviceDate || '',
    extracted_date_of_service: ext.serviceDateRaw || ext.serviceDate || '',
    extracted_date_confidence: ext.serviceDate ? (ext.confidence === 'high' ? 0.85 : 0.62) : 0,
    insurance:        ext.insuranceName   || '',
    extracted_insurance: ext.insuranceName || '',
    extracted_insurance_confidence: ext.insuranceName ? 0.7 : 0,
    account_number:   ext.claimNumber     || '',
    extracted_account_number: ext.claimNumber || '',
    extracted_account_confidence: ext.claimNumber ? 0.74 : 0,
    bill_type:        inferBillType(ext.rawText || ''),
    payment_status:   ext.patientBalance  != null
                        ? (ext.patientBalance > 0 ? 'balance due' : 'paid in full')
                        : 'unknown',
    concern_other:    ext.denialDetected ? 'Claim denial detected — appeal review needed' : '',
    /* Scan meta flags — used by applyDashboard() for copy variants */
    _scan:            true,
    _patient_balance: ext.patientBalance,
    _total_billed:    ext.totalBilled,
    _claim_number:    ext.claimNumber,
    _confidence:      ext.confidence,
    _denial:          ext.denialDetected,
    _has_duplicates:  ext.hasDuplicateCodes,
    _cpt_codes:       ext.cptCodes        || [],
    _page_count:      ext.pageCount       || 1,
    _scan_ts:         ext._scanTimestamp
  };

  try {
    const session = {
      version: 4,
      sessionId: caseId,
      activeCaseId: caseId,
      createdAt: activeAt,
      updatedAt: activeAt,
      stage: 'scan-complete',
      source: 'scan',
      paid: false,
      intake: compat
    };
    const active = { version: 1, caseId: caseId, source: 'scan', updatedAt: activeAt, intake: compat, session: session, scan: ext };
    sessionStorage.setItem(INTAKE_KEY, JSON.stringify(compat));
    localStorage.setItem(INTAKE_KEY,   JSON.stringify(compat));
    sessionStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
    localStorage.setItem(ACTIVE_KEY,   JSON.stringify(active));
    sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(session));
    localStorage.setItem(CHECKOUT_KEY,   JSON.stringify(session));
    sessionStorage.setItem(REVIEW_KEY, JSON.stringify(session));
    localStorage.setItem(REVIEW_KEY,   JSON.stringify(session));
    console.log(
      '[UPA] ✅ Active case written to storage' +
      '\n  caseId:   ' + caseId +
      '\n  provider: ' + (compat.provider || '—') +
      '\n  amount:   ' + (compat.bill_amount || '—') +
      '\n  source:   scan' +
      '\n  ts:       ' + activeAt +
      '\n  provisional: ' + !!(ext._provisional)
    );
    // Wipe ALL stale-case keys so a new scan can never inherit a previous session's data
    [PAID_KEY, CASE_KEY, DASHBOARD_KEY,
     'upa.case.handoff.token.v1',   // encoded prior case token
     'upa.dashboard.state.v1'       // redundant but explicit
    ].forEach(function(key){
      try{ sessionStorage.removeItem(key); localStorage.removeItem(key); }catch(e){}
    });
    try{ sessionStorage.removeItem('upa.paid'); localStorage.removeItem('upa.paid'); }catch(e){}
  } catch(e){ console.warn('[UPA Scan Engine] Storage write failed', e); }
}

/* ─────────────────────────────────────────────
   PUBLIC API
───────────────────────────────────────────── */

window.UPAScanEngine = {
  extractFromPDF,
  buildScanFindings,
  buildCaseValueEstimate,
  writeScanStateToStorage,
  formatCurrency,
  formatDateDisplay,
  inferBillType
};
