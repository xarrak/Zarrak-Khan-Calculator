// The brief: invalid input must give a clear message, never a crash or a
// wrong result; and the user must never see NaN, Infinity, undefined or a
// blank result. Every string the page shows comes from compute(), so this
// test runs compute() on thousands of random inputs and checks every string
// in its output. The random generator is seeded, so a failure is repeatable.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compute, initialState } from '../src/lib/engine.js';

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const MONEY = ['', ' ', '0', '0.00', '0.01', '.5', '12.', '007', '1', '10.05', '100', '999999.99', '1000000',
  '1000000.01', '1e15', '1000000000000000', '0.001', '-5', '+5', 'abc', '1,250', 'Rs 1250', '₨1', 'NaN',
  'Infinity', 'undefined', '.', '..', '1..2', '\t42\n', '١٢٣', '۱۰۰.۵', '12,50', ',5', '1 000', '1 000.50',
  '−5', '–5', '—0', '9'.repeat(400)];
const TIPS = ['', '0', '0.01', '12.5', '15%', ' 15% ', '100', '100.01', '100.001', '-0.001', 'ten', '1e15', '%', 'NaN',
  '12,5', '۱۵', '1,500'];
const PEOPLE = ['', '0', '1', '2', '3', '04', '7', '50', '51', '2.5', '-3', 'two', '1e15', 'Infinity', '۴', '٥٠', '9'.repeat(400)];
const NAMES = ['', '   ', 'Ali', 'Khan, Ali', '<img src=x onerror=alert(1)>', 'x'.repeat(30)];

function allStrings(value, found = []) {
  if (typeof value === 'string') found.push(value);
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, found));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => allStrings(v, found));
  return found;
}

test('Safety: 20,000 random inputs never crash and never show NaN, Infinity, undefined or a blank result', () => {
  const random = seededRandom(20261018);
  const pick = (list) => list[Math.floor(random() * list.length)];
  // "NaN", "Infinity" and "undefined" may appear only as text the user typed (a row name or label).
  const bad = /NaN|Infinity|undefined|null/;

  for (let i = 0; i < 20000; i++) {
    const rowCount = 1 + Math.floor(random() * 4);
    const state = {
      ...initialState(),
      mode: random() < 0.5 ? 'even' : 'order',
      subtotal: pick(MONEY),
      tax: pick(MONEY),
      tipChoice: pick(['0', '10', '15', '20', 'custom']),
      customTip: pick(TIPS),
      people: pick(PEOPLE),
      rows: Array.from({ length: rowCount }, (_, r) => ({ id: r + 1, name: pick(NAMES), ordered: pick(MONEY) })),
      nextRowId: rowCount + 1,
      left: random() < 0.5 ? {} : { subtotal: true, tax: true, customTip: true, people: true, 'ordered:1': true },
    };

    let output;
    assert.doesNotThrow(() => (output = compute(state)), `compute threw for ${JSON.stringify(state)}`);

    const userNames = new Set(state.rows.map((row) => row.name.trim()));
    for (const text of allStrings(output)) {
      if (userNames.has(text)) continue;
      assert.ok(!bad.test(text), `bad text "${text}" for ${JSON.stringify(state)}`);
    }

    if (output.results === null) {
      assert.ok(output.resultsMessage, `no results and no message for ${JSON.stringify(state)}`);
    } else {
      for (const line of output.results.receipt) assert.ok(line.label && line.value, 'blank receipt line');
      for (const line of output.results.split ?? []) assert.ok(line.trim(), 'blank split line');
      for (const row of output.results.table ?? []) {
        assert.ok(row.label && row.ordered && row.share && row.owes, 'blank table cell');
      }
    }
  }
});
