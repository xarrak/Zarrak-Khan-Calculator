// The arithmetic in src/lib/calc.js, checked directly against values from
// the acceptance criteria. All amounts are BigInt cents.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tipCents, evenSplit, allocateExtra } from '../src/lib/calc.js';

test('S-2.3: 15% of 10.05 is 1.51 (1.5075 rounded)', () => {
  assert.equal(tipCents(1005n, 1500n), 151n);
});

test('S-2.13: 15% of 0.10 is exactly 1.5 cents, rounded up to 0.02', () => {
  assert.equal(tipCents(10n, 1500n), 2n);
});

test('S-2.14: 10% of 0.05 is exactly 0.5 cents, rounded up to 0.01', () => {
  assert.equal(tipCents(5n, 1000n), 1n);
});

test('S-2.17: 10% of 0.01 is 0.1 cent, rounded down to 0.00', () => {
  assert.equal(tipCents(1n, 1000n), 0n);
});

test('S-3.2: 100.00 split 3 ways is one share of 33.34 and two of 33.33', () => {
  assert.deepEqual(evenSplit(10000n, 3n), { base: 3333n, higherCount: 1n, lowerCount: 2n });
});

test('S-3.9: 3,000,000.00 split 7 ways is six shares of 428,571.43 and one of 428,571.42', () => {
  assert.deepEqual(evenSplit(300000000n, 7n), { base: 42857142n, higherCount: 6n, lowerCount: 1n });
});

test('S-6.1: tax and tip of 26.00 are shared 15.60 / 10.40 for orders of 60.00 / 40.00', () => {
  assert.deepEqual(allocateExtra([6000n, 4000n], 2600n), [1560n, 1040n]);
});

test('S-6.2: a tied leftover cent goes to the person higher in the list', () => {
  assert.deepEqual(allocateExtra([1000n, 1000n, 1000n], 100n), [34n, 33n, 33n]);
});

test('S-6.7: the leftover cent goes to the person with the larger remainder', () => {
  assert.deepEqual(allocateExtra([1n, 9999n], 1500n), [0n, 1500n]);
});

test('S-6.10: with large values, the tied leftover cent still goes to Person 1 (needs BigInt)', () => {
  // Orders 864,730.53 and 96,081.17; tax 459,405.35 plus a 100% tip of 960,811.70.
  // Both exact shares end in half a cent. Ordinary numbers miscalculate the
  // remainders and give the cent to Person 2.
  const extra = 45940535n + 96081170n;
  assert.deepEqual(allocateExtra([86473053n, 9608117n], extra), [127819535n, 14202170n]);
});
