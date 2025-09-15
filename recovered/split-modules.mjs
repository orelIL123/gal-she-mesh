import fs from 'fs';

const file = 'recovered/recovered.js';
if (!fs.existsSync(file)) {
  console.error('recovered/recovered.js לא נמצא'); process.exit(1);
}
const src = fs.readFileSync(file, 'utf8');

const re = /__d\s*\(\s*function\s*\([\s\S]*?\)\s*\{\s*([\s\S]*?)\s*\}\s*,\s*(\d+)\s*,\s*\[([\s\S]*?)\]\s*(?:,\s*\d+)?\s*\)\s*;?/g;

let m, count=0;
while ((m = re.exec(src)) !== null) {
  const body = m[1];
  const id = m[2];
  const outPath = `recovered/modules/module_${id}.js`;
  fs.writeFileSync(outPath, body + '\n', 'utf8');
  count++;
}
console.log(`Extracted ${count} modules to recovered/modules/`);
