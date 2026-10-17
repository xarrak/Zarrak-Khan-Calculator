// D-25: every message the app shows must appear in docs/user-stories.md
// exactly as written there. This catches a reworded message or a curly
// apostrophe before a reviewer does.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as M from '../src/lib/messages.js';

const stories = readFileSync(new URL('../docs/user-stories.md', import.meta.url), 'utf8');
const quoted = (text) => `"${text}"`;

test('D-25: every fixed message appears in user-stories.md exactly', () => {
  const fixed = Object.entries(M).filter(([, value]) => typeof value === 'string');
  assert.ok(fixed.length >= 15, 'expected all fixed messages to be exported');
  for (const [name, text] of fixed) {
    assert.ok(stories.includes(quoted(text)), `${name} not found in user-stories.md: ${quoted(text)}`);
  }
});

test('D-25: the warning and total-row templates match user-stories.md exactly', () => {
  const rendered = [
    M.warningBelow('A', 'S', 'D'),
    M.warningAbove('A', 'D', 'S'),
    M.totalBelow('D', 'T'),
    M.totalAbove('D', 'T'),
    M.labelTip('P'),
  ];
  for (const text of rendered) {
    assert.ok(stories.includes(quoted(text)), `template not found: ${quoted(text)}`);
  }
});

test('D-25: the even-split lines match the wording in the S-3 criteria', () => {
  const rendered = [
    M.eachPays('315.00'),
    M.groupPays(1n, '33.34'),
    M.groupPays(2n, '33.33'),
    M.sharesAddUp(4n, '1,260.00'),
    M.sharesAddUp(1n, '1,260.00'),
    M.defaultPersonLabel(1),
  ];
  for (const text of rendered) {
    assert.ok(stories.includes(quoted(text)), `line not found: ${quoted(text)}`);
  }
});
