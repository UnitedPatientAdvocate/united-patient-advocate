const fs = require('fs');
const path = require('path');

const jpgPath = path.join(__dirname, 'START-HERE-ACCESS-YOUR-COMPLETE-BILLING-REVIEW-master.jpg');
const outPath = path.join(__dirname, 'START-HERE-ACCESS-YOUR-COMPLETE-BILLING-REVIEW.pdf');
const jpg = fs.readFileSync(jpgPath);
const width = 1103;
const height = 1426;

const objects = [];
const add = (body) => {
  objects.push(body);
  return objects.length;
};

add('<< /Type /Catalog /Pages 2 0 R >>');
add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
add(Buffer.concat([
  Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`, 'binary'),
  jpg,
  Buffer.from('\nendstream', 'binary')
]));
const content = 'q\n612 0 0 792 0 0 cm\n/Im0 Do\nQ\n';
add(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream`);

let pdf = Buffer.from('%PDF-1.4\n', 'binary');
const offsets = [0];
for (let i = 0; i < objects.length; i++) {
  offsets.push(pdf.length);
  const head = Buffer.from(`${i + 1} 0 obj\n`, 'binary');
  const body = Buffer.isBuffer(objects[i]) ? objects[i] : Buffer.from(objects[i], 'binary');
  const tail = Buffer.from('\nendobj\n', 'binary');
  pdf = Buffer.concat([pdf, head, body, tail]);
}
const xref = pdf.length;
let trailer = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (let i = 1; i <= objects.length; i++) trailer += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
trailer += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
pdf = Buffer.concat([pdf, Buffer.from(trailer, 'binary')]);
fs.writeFileSync(outPath, pdf);
console.log(outPath);
console.log(fs.statSync(outPath).size);
