import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const inputPath = path.join(repoRoot, 'api', 'data', 'PUF_CLFS_CY2026_Q2V1.csv');
const outputPath = path.join(repoRoot, 'api', 'data', 'cms-clfs-2026.json');
const expectedHeader = 'YEAR,HCPCS,MOD,EFF_DATE,INDICATOR,RATE,SHORTDESC,LONGDESC,EXTENDEDLONGDESC';

function parseCsvLine(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      fields.push(field);
      field = '';
      continue;
    }

    field += char;
  }

  fields.push(field);
  return fields;
}

function parseRate(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

const csv = fs.readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, '');
const lines = csv.split(/\r?\n/);
const headerIndex = lines.findIndex(line => line.trim() === expectedHeader);

if (headerIndex === -1) {
  throw new Error(`Unable to find confirmed CLFS header: ${expectedHeader}`);
}

const output = {
  metadata: {
    source: 'CMS CLFS CY2026 Q2V1',
    year: 2026
  }
};

let rowCount = 0;
for (const line of lines.slice(headerIndex + 1)) {
  if (!line.trim()) continue;

  const [
    year,
    hcpcs,
    modifier,
    effectiveDate,
    indicator,
    rate,
    shortDescription
  ] = parseCsvLine(line);

  const code = String(hcpcs || '').trim().toUpperCase();
  if (!code) continue;

  const item = output[code] || {
    code,
    default: null,
    modifiers: {}
  };

  const entry = {
    modifier: String(modifier || '').trim().toUpperCase(),
    rate: parseRate(rate),
    shortDescription: String(shortDescription || '').trim(),
    effectiveDate: String(effectiveDate || '').trim(),
    indicator: String(indicator || '').trim(),
    year: Number.parseInt(year, 10) || 2026
  };

  if (entry.modifier) {
    item.modifiers[entry.modifier] = entry;
  } else {
    item.default = entry;
  }

  output[code] = item;
  rowCount += 1;
}

output.metadata.rowCount = rowCount;
output.metadata.codeCount = Object.keys(output).filter(key => key !== 'metadata').length;

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Built ${path.relative(repoRoot, outputPath)} from ${rowCount} CLFS rows.`);
