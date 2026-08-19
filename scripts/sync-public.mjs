import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pairs = [
  ['frontend', 'backend/public/frontend'],
  ['admin', 'backend/public/admin']
];

function copyTree(src, dst) {
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(dst, { recursive: true });
  fs.cpSync(src, dst, { recursive: true, force: true });
}

for (const [srcRel, dstRel] of pairs) {
  const src = path.join(root, srcRel);
  const dst = path.join(root, dstRel);
  if (!fs.existsSync(src)) throw new Error(`Missing source directory: ${srcRel}`);
  copyTree(src, dst);
}

fs.writeFileSync(path.join(root, 'backend/public/README.txt'), 'GENERATED DEPLOYMENT ARTIFACT\n\nDo not edit this directory directly. Edit frontend/ or admin/ and run npm run sync:public.\n');
console.log('Synced frontend/ -> backend/public/frontend');
console.log('Synced admin/    -> backend/public/admin');
