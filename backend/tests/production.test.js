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

test('API worker does not depend on an optional ASSETS binding',()=>{
  const w=fs.readFileSync('worker.js','utf8');
  assert.equal(w.includes('env.ASSETS.fetch'),false);
  assert.match(w,/NOT_FOUND/);
});

test('authentication uses host-only cookies and an absolute session lifetime',()=>{
  const w=fs.readFileSync('worker.js','utf8');
  assert.match(w,/__Host-capital_session/);
  assert.match(w,/__Host-capital_admin_session/);
  assert.match(w,/sessionAbsoluteMinutes/);
  assert.match(w,/adminSessionAbsoluteMinutes/);
});

test('Pages API proxy keeps browser API calls on the Pages origin',()=>{
  const f=fs.readFileSync(path.join(process.cwd(),'../functions/api/[[path]].js'),'utf8');
  const routes=fs.readFileSync(path.join(process.cwd(),'../frontend/_routes.json'),'utf8');
  assert.match(f,/capital-api\.bamyanonline\.workers\.dev/);
  assert.match(f,/request\.headers\.get\("CF-Connecting-IP"\)/);
  assert.match(routes,/\/api\/\*/);
});

test('market client accepts the backend envelope and does not open Binance WebSockets',()=>{
  const m=fs.readFileSync(path.join(process.cwd(),'../frontend/assets/market.js'),'utf8');
  assert.match(m,/payload\.data/);
  assert.equal(m.includes('new WebSocket'),false);
  assert.equal(m.includes('stream.binance.com'),false);
});

test('pre-30-day referral bonus reversal is implemented server-side',()=>{
  const w=fs.readFileSync('worker.js','utf8');
  assert.match(w,/invitee_deleted_before_30_days/);
  assert.match(w,/referral_bonus_reversed/);
  assert.match(w,/localDaysBetween\(investmentStart,deletionNow\)/);
});
