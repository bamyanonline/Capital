import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const frontend=path.join(root,'frontend');
const admin=path.join(root,'admin');
const htmlFiles=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).filter(e=>e.isFile()&&e.name.endsWith('.html')).map(e=>path.join(dir,e.name));
for(const file of htmlFiles(frontend)){
  const text=fs.readFileSync(file,'utf8');
  if(!text.includes('assets/style.css')) throw new Error(`Frontend page missing shared stylesheet: ${path.relative(root,file)}`);
  if(/<style\b/i.test(text)) throw new Error(`Inline style block is forbidden: ${path.relative(root,file)}`);
}
for(const file of htmlFiles(admin)){
  const text=fs.readFileSync(file,'utf8');
  if(!text.includes('./assets/admin.css')) throw new Error(`Admin page missing shared stylesheet: ${path.relative(root,file)}`);
  if(/<style\b/i.test(text)) throw new Error(`Inline style block is forbidden: ${path.relative(root,file)}`);
}
const publicFrontend=path.join(root,'backend/public/frontend/assets/style.css');
const publicAdmin=path.join(root,'backend/public/admin/assets/admin.css');
if(fs.existsSync(publicFrontend)&&fs.readFileSync(publicFrontend,'utf8')!==fs.readFileSync(path.join(frontend,'assets/style.css'),'utf8')) throw new Error('Generated frontend CSS is out of sync');
if(fs.existsSync(publicAdmin)&&fs.readFileSync(publicAdmin,'utf8')!==fs.readFileSync(path.join(admin,'assets/admin.css'),'utf8')) throw new Error('Generated admin CSS is out of sync');
console.log('UI architecture: one shared CSS source per surface; no inline style blocks.');
