const fs = require('fs');
const path = require('path');

const out = path.join(process.cwd(), 'gumroad-fulfillment', 'START-HERE-ACCESS-YOUR-COMPLETE-BILLING-REVIEW.pdf');
const objects = [];
const add = (body) => { objects.push(body); return objects.length; };
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

function text(x, y, size, value, font = 'F1', color = '0 0 0') {
  return `${color} rg\nBT /${font} ${size} Tf ${x} ${y} Td (${esc(value)}) Tj ET\n`;
}
function rect(x, y, w, h, color) {
  return `${color} rg\n${x} ${y} ${w} ${h} re f\n`;
}
function strokeRect(x, y, w, h, stroke, width = 1) {
  return `${stroke} RG\n${width} w\n${x} ${y} ${w} ${h} re S\n`;
}
function line(x1, y1, x2, y2, color, width = 1) {
  return `${color} RG\n${width} w\n${x1} ${y1} m ${x2} ${y2} l S\n`;
}
function bullet(x, y, value) {
  return rect(x, y + 4, 7, 7, '0.37 0.79 0.75') + text(x + 14, y, 12.5, value, 'F1', '0.20 0.35 0.39');
}

let c = '';
c += rect(0, 660, 612, 132, '0.05 0.35 0.38');
c += rect(0, 655, 612, 5, '0.43 0.83 0.79');
c += text(70, 724, 25, 'United Patient Advocate', 'F2', '1 1 1');
c += text(72, 700, 13.5, 'Consumer Billing Review & Advocacy Platform', 'F1', '0.45 0.83 0.78');
c += strokeRect(44, 694, 54, 54, '0.43 0.83 0.79', 1.5);
c += text(58, 714, 16, 'UPA', 'F2', '1 1 1');

c += rect(54, 98, 504, 508, '1 1 1');
c += strokeRect(54, 98, 504, 508, '0.74 0.86 0.89', 1);
c += rect(54, 548, 504, 58, '0.90 0.96 0.97');
c += text(82, 570, 13, 'START HERE - ACCESS INFORMATION', 'F2', '0.08 0.46 0.51');

c += strokeRect(282, 500, 48, 48, '0.35 0.79 0.75', 2);
c += text(296, 517, 15, 'OK', 'F2', '0.05 0.35 0.38');
c += text(123, 468, 25, 'Your Complete Billing Review Is Ready', 'F2', '0.10 0.19 0.23');
c += text(107, 438, 13.5, 'Thank you for your purchase. Use the access page below to continue', 'F1', '0.22 0.36 0.41');
c += text(192, 420, 13.5, 'into your United Patient Advocate review experience.', 'F1', '0.22 0.36 0.41');

c += text(252, 385, 16, 'Continue Here:', 'F2', '0.10 0.19 0.23');
c += rect(92, 330, 428, 42, '0.91 0.97 0.98');
c += strokeRect(92, 330, 428, 42, '0.35 0.79 0.75', 2);
c += text(134, 346, 17, 'UPA-Final/04_upa-dashboard.html', 'F2', '0.05 0.34 0.38');

c += text(206, 300, 13, 'YOUR PURCHASE INCLUDES ACCESS TO:', 'F2', '0.24 0.38 0.42');
c += bullet(112, 270, 'Complete Billing Review dashboard');
c += bullet(330, 270, 'Upload center for bill documents');
c += bullet(112, 246, 'Billing education tools');
c += bullet(330, 246, 'Personalized billing workflow');

c += rect(82, 174, 448, 46, '0.96 0.98 0.98');
c += strokeRect(82, 174, 448, 46, '0.78 0.87 0.90', 1);
c += text(101, 202, 12.5, 'What to do next', 'F2', '0.10 0.19 0.23');
c += text(101, 185, 11.5, 'Open the link above on the same device/browser when possible. Upload your bill,', 'F1', '0.29 0.43 0.46');
c += text(101, 171, 11.5, 'statement, explanation of benefits, or other supporting documents from the dashboard.', 'F1', '0.29 0.43 0.46');

c += line(82, 148, 530, 148, '0.78 0.87 0.90', 1);
c += text(191, 128, 12.5, 'Need help? Contact: support@unitedpatientadvocate.com', 'F2', '0.05 0.34 0.38');

c += rect(0, 0, 612, 62, '0.93 0.97 0.98');
c += line(0, 62, 612, 62, '0.78 0.87 0.90', 1);
c += text(77, 38, 9.6, 'Educational and informational billing review support only. Not legal, medical, insurance, or financial advice.', 'F1', '0.34 0.49 0.53');
c += text(78, 22, 9.6, 'No outcomes are guaranteed. United Patient Advocate does not promise reductions, refunds, corrections, or specific results.', 'F1', '0.34 0.49 0.53');

const catalogId = add('<< /Type /Catalog /Pages 2 0 R >>');
const pagesId = add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
const pageId = add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R /Annots [7 0 R] >>');
const font1Id = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
const font2Id = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
const streamId = add(`<< /Length ${Buffer.byteLength(c, 'utf8')} >>\nstream\n${c}\nendstream`);
const annotId = add('<< /Type /Annot /Subtype /Link /Rect [92 330 520 372] /Border [0 0 0] /A << /S /URI /URI (https://unitedpatientadvocate.com/UPA-Final/04_upa-dashboard.html) >> >>');

let pdf = '%PDF-1.4\n';
const offsets = [0];
objects.forEach((body, i) => {
  offsets.push(Buffer.byteLength(pdf, 'utf8'));
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
});
const xref = Buffer.byteLength(pdf, 'utf8');
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (let i = 1; i <= objects.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

fs.writeFileSync(out, pdf, 'binary');
console.log(out);
console.log(fs.statSync(out).size);



