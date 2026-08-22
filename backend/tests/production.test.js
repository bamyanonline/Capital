import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const worker = () => fs.readFileSync('worker.js','utf8');

test('production package has no browser financial storage adapter',()=>{
  const api=fs.readFileSync(path.join(process.cwd(),'../frontend/assets/api.js'),'utf8');
  assert.equal(api.includes('capital'+'MockDB'),false);
  assert.equal(api.includes('localStorage'),false);
});

test('worker does not expose internal exception details',()=>{
  const w=worker();
  assert.equal(w.includes("return fail('SERVER_ERROR',500,origin,env,e.message)"),false);
});

test('withdrawal approval is not falsely marked blockchain-complete',()=>{
  const w=worker();
  assert.equal(w.includes("status='completed',blockchain_status='manual_pending'"),false);
  assert.match(w,/status='approved',blockchain_status='awaiting_broadcast'/);
  assert.match(w,/status='completed',blockchain_status='confirmed'/);
});

test('production frontend does not rely on inline event handlers',()=>{
  const dir=path.join(process.cwd(),'../frontend');
  const stack=[];
  const walk=(d)=>{for(const n of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,n.name);if(n.isDirectory())walk(p);else if(n.name.endsWith('.html'))stack.push(fs.readFileSync(p,'utf8'));}};
  walk(dir);
  assert.equal(stack.some(x=>/\bon(?:click|change|submit|load)\s*=/.test(x)),false);
  assert.equal(stack.some(x=>/<script>/.test(x)),false);
});

test('API worker does not depend on an optional ASSETS binding',()=>{
  const w=worker();
  assert.equal(w.includes('env.ASSETS.fetch'),false);
  assert.match(w,/NOT_FOUND/);
});

test('authentication uses host-only cookies and an absolute session lifetime',()=>{
  const w=worker();
  assert.match(w,/__Host-capital_session/);
  assert.match(w,/__Host-capital_admin_session/);
  assert.match(w,/sessionAbsoluteMinutes/);
  assert.match(w,/adminSessionAbsoluteMinutes/);
});

test('production CORS allow-list contains both customer and admin origins',()=>{
  const c=fs.readFileSync(path.join(process.cwd(),'wrangler.jsonc'),'utf8');
  assert.match(c,/https:\/\/capitalism\.pages\.dev,https:\/\/capitalism-admin\.pages\.dev/);
  const w=worker();
  assert.match(w,/ALLOWED_ORIGINS/);
  assert.match(w,/allowed\.includes\(origin\)/);
});

test('admin Pages surface has its own API proxy and route manifest',()=>{
  const f=fs.readFileSync(path.join(process.cwd(),'../admin/functions/api/[[path]].js'),'utf8');
  const routes=fs.readFileSync(path.join(process.cwd(),'../admin/_routes.json'),'utf8');
  assert.match(f,/capital-api\.bamyanonline\.workers\.dev/);
  assert.match(f,/CF-Connecting-IP/);
  assert.match(routes,/\/api\/\*/);
});

test('Pages API proxy keeps browser API calls on the Pages origin',()=>{
  const f=fs.readFileSync(path.join(process.cwd(),'../functions/api/[[path]].js'),'utf8');
  const routes=fs.readFileSync(path.join(process.cwd(),'../frontend/_routes.json'),'utf8');
  assert.match(f,/capital-api\.bamyanonline\.workers\.dev/);
  assert.match(f,/CF-Connecting-IP/);
  assert.match(routes,/\/api\/\*/);
});

test('market client accepts the backend envelope and does not open Binance WebSockets',()=>{
  const m=fs.readFileSync(path.join(process.cwd(),'../frontend/assets/market.js'),'utf8');
  assert.match(m,/payload\.data/);
  assert.equal(m.includes('new WebSocket'),false);
  assert.equal(m.includes('stream.binance.com'),false);
});

test('pre-30-day referral bonus reversal is implemented server-side',()=>{
  const w=worker();
  assert.match(w,/invitee_deleted_before_30_days/);
  assert.match(w,/referral_bonus_reversed/);
  assert.match(w,/localDaysBetween\(investmentStart,deletionNow\)/);
});

test('production removes legacy bundled access and forbids plaintext admin password fallback',()=>{
  const m=fs.readFileSync(path.join(process.cwd(),'migrations/0011_remove_legacy_access.sql'),'utf8');
  assert.match(m,/ADM_NACAM/);
  assert.match(m,/CAPNACAM/);
  assert.doesNotMatch(m,/nacam@gmail\.com/i);
  const w=worker();
  assert.equal(w.includes('env.ADMIN_PASSWORD||'),false);
  assert.match(w,/TRONSCAN_API_KEY/);
});
test('admin financial settings are immutable and withdrawal config is published from server constants',()=>{
  const w=worker();
  assert.match(w,/FINANCIAL_SETTINGS_IMMUTABLE/);
  assert.match(w,/withdrawalFee/);
  assert.match(w,/minimumRemaining/);
});

test('financial rules are not sourced from mutable system_settings values',()=>{
  const w=worker();
  assert.match(w,/withdrawalFee: 0\.10/);
  assert.match(w,/teamRate: 0\.001/);
  assert.match(w,/referralRate: 0\.05/);
  assert.match(w,/teamMultiplier: 3/);
  assert.match(w,/network:CONFIG\.depositNetwork/);
});

test('direct team capital query excludes blocked users',()=>{
  const w=worker();
  assert.match(w,/SUM\(invested_capital_micro\).*FROM users WHERE referred_by=\? AND status='active'/s);
});

test('withdrawal rejection couples user reservation release to the claimed withdrawal nonce',()=>{
  const w=worker();
  assert.match(w,/status='rejected' AND processing_nonce=\?/);
  assert.match(w,/status='approved' AND processing_nonce=\?/);
});

test('deposit approval requires on-chain verification configuration',()=>{
  const w=worker();
  assert.match(w,/BLOCKCHAIN_PROVIDER_NOT_CONFIGURED/);
  assert.match(w,/verifyDepositOnChain\(env,d\)/);
});
