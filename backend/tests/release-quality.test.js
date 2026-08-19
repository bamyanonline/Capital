import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.join(process.cwd(),'..');
function allFiles(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.name==='node_modules'||e.name==='.git')continue;if(e.isDirectory())out.push(...allFiles(p));else out.push(p)}return out}

test('release package has no preview navigation or non-production compatibility code',()=>{
  const files=allFiles(root).filter(f=>/\.(html|js|jsonc|sql)$/.test(f));
  const text=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');
  assert.equal(text.includes('capital'+'MockDB'),false);
  assert.equal(text.includes('capital'+'PreviewMode'),false);
  assert.equal(text.includes('Admin'+'PreviewAuth'),false);
  assert.equal(text.includes('assets.html?'+ 'preview=1'),false);
});

test('frontend has Spanish locale and English-digit normalization',()=>{
  const i18n=fs.readFileSync(path.join(root,'frontend/assets/i18n.js'),'utf8');
  const app=fs.readFileSync(path.join(root,'frontend/assets/app.js'),'utf8');
  assert.match(i18n,/Object\.assign\(langs\.es/);
  assert.match(i18n,/normalizeEnglishDigits/);
  assert.match(app,/normalizeDisplayedDigits/);
});

test('requested inspection accounts are seeded as hashes only',()=>{
  const m=fs.readFileSync(path.join(root,'backend/migrations/0007_access_accounts.sql'),'utf8');
  assert.match(m,/nacam@gmail\.com/);
  assert.match(m,/pbkdf2\$/);
  assert.match(m,/pbkdf2\$[0-9a-f]+\$[0-9a-f]+/);
  assert.equal(m.includes('34'+'A092'),false);
});

test('admin remains bilingual English/Persian only',()=>{
  const a=fs.readFileSync(path.join(root,'admin/assets/admin.js'),'utf8');
  assert.match(a,/English/); assert.match(a,/فارسی/);
  assert.doesNotMatch(a,/Español/);
});
