import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('production package has no browser financial storage adapter',()=>{
  const api=fs.readFileSync(path.join(process.cwd(),'../frontend/assets/api.js'),'utf8');
  assert.equal(api.includes('capital'+'MockDB'),false);
  assert.equal(api.includes('localStorage'),false);
});
test('worker does not expose internal exception details',()=>{
  const w=fs.readFileSync('worker.js','utf8');
  assert.equal(w.includes("return fail('SERVER_ERROR',500,origin,env,e.message)"),false);
});
test('withdrawal approval is not falsely marked blockchain-complete',()=>{
  const w=fs.readFileSync('worker.js','utf8');
  assert.equal(w.includes("status='completed',blockchain_status='manual_pending'"),false);
  assert.equal(w.includes("status='approved',blockchain_status='awaiting_broadcast'"),true);
});

test('production frontend does not rely on inline event handlers',()=>{
  const dir=path.join(process.cwd(),'../frontend');
  const stack=[];
  const walk=(d)=>{for(const n of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,n.name);if(n.isDirectory())walk(p);else if(n.name.endsWith('.html'))stack.push(fs.readFileSync(p,'utf8'))}};
  walk(dir);
  assert.equal(stack.some(x=>/on(?:click|change|submit|load)\s*=/.test(x)),false);
  assert.equal(stack.some(x=>/<script>/.test(x)),false);
});
