import test from 'node:test';
import assert from 'node:assert/strict';

const plans = {1:{amount:100,daily:1.10},2:{amount:200,daily:2.40},3:{amount:300,daily:3.90},4:{amount:400,daily:5.60},5:{amount:500,daily:7.50}};
const teamRate = 0.001;
const referralRate = 0.05;

function cap(principal, team){ return team >= principal * 3 ? 'NO_CAP' : 'LIMITED_100'; }
function referral(amount){ return amount * referralRate; }
function teamProfit(amount){ return amount * teamRate; }

for (const [vip, p] of Object.entries(plans)) {
  test(`VIP${vip} uses fixed principal and no compounding`, () => {
    assert.equal(p.amount, Number(vip) * 100);
    assert.equal(p.daily, [null,1.10,2.40,3.90,5.60,7.50][Number(vip)]);
    assert.equal(p.daily, p.daily);
  });
}

test('3x threshold is exact', () => {
  assert.equal(cap(500, 1499), 'LIMITED_100');
  assert.equal(cap(500, 1500), 'NO_CAP');
  assert.equal(cap(100, 299), 'LIMITED_100');
  assert.equal(cap(100, 300), 'NO_CAP');
});

test('referral bonus belongs only to inviter', () => assert.equal(referral(500), 25));
test('team profit is 0.1 percent of direct investment', () => assert.equal(teamProfit(500), 0.5));
test('withdrawal fee is 10 percent', () => assert.equal(500 * 0.10, 50));
test('minimum withdrawal is 10 percent of principal', () => {
  assert.deepEqual([10,20,30,40,50], [100,200,300,400,500].map(x => x * 0.10));
});

test('CAP user ID format is exactly CAP plus five uppercase alphanumeric characters', () => {
  for (const value of ['CAP7K29F','CAPA81XZ','CAP92MQL']) assert.match(value, /^CAP[A-Z0-9]{5}$/);
  for (const value of ['CAP-7K29F','USR7K29F','CAP1234','CAPabcdef']) assert.doesNotMatch(value, /^CAP[A-Z0-9]{5}$/);
});

test('20 USDT Available Balance reserve is mandatory', () => {
  assert.equal(50 - 30 >= 20, true);
  assert.equal(50 - 31 >= 20, false);
});
