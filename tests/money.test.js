// Money and percentage text handling. Money is BigInt cents from input to
// display (D-6, D-19), so these tests compare BigInts exactly.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitDecimal, toHundredths, formatCents, formatPercent } from '../src/lib/money.js';

const cents = (text) => toHundredths(splitDecimal(text));

test('D-6: 0.10 + 0.20 is exactly 0.30, with no floating-point error', () => {
  assert.equal(cents('0.1') + cents('0.2'), 30n);
  assert.equal(formatCents(cents('0.1') + cents('0.2')), '0.30');
  assert.notEqual(0.1 + 0.2, 0.3); // the floating-point problem this avoids
});

test('S-1.5: ".5", "12." and "007" read as 50, 1200 and 700 cents', () => {
  assert.equal(cents('.5'), 50n);
  assert.equal(cents('12.'), 1200n);
  assert.equal(cents('007'), 700n);
});

test('S-1.7: text that is not digits with one optional decimal point is rejected', () => {
  for (const text of ['abc', '12abc', '+5', '10.0.5', '1e15', '.', '']) {
    assert.equal(splitDecimal(text), null, text);
  }
});

test('S-1.2: amounts are shown with 2 decimal places and comma thousands separators', () => {
  assert.equal(formatCents(100000n), '1,000.00');
  assert.equal(formatCents(126000n), '1,260.00');
  assert.equal(formatCents(1n), '0.01');
  assert.equal(formatCents(0n), '0.00');
  assert.equal(formatCents(300000000n), '3,000,000.00');
});

test('S-2.6: tip percentages are shown without trailing decimal zeros', () => {
  assert.equal(formatPercent(1250n), '12.5'); // 12.50
  assert.equal(formatPercent(700n), '7'); // 007
  assert.equal(formatPercent(10n), '0.1'); // 0.10
  assert.equal(formatPercent(1n), '0.01');
  assert.equal(formatPercent(10000n), '100');
  assert.equal(formatPercent(0n), '0');
});
