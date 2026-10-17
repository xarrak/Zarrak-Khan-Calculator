// Shared helpers for the tests. This file is not itself a test file
// (node --test only runs files named *.test.js).

import { initialState } from '../src/lib/engine.js';

/** A "Split evenly" state: the opening state with some fields changed. */
export function evenState(overrides = {}) {
  return { ...initialState(), ...overrides };
}

/**
 * A "Split by order" state. `rows` is a list of ordered amounts, or of
 * [name, ordered] pairs. Rows get ids 1, 2, 3 and so on.
 */
export function orderState(overrides = {}, rows = []) {
  const built = rows.map((spec, i) =>
    Array.isArray(spec)
      ? { id: i + 1, name: spec[0], ordered: spec[1] }
      : { id: i + 1, name: '', ordered: spec },
  );
  return {
    ...initialState(),
    mode: 'order',
    rows: built,
    nextRowId: built.length + 1,
    ...overrides,
  };
}

/** The receipt lines as the user reads them, e.g. "Subtotal 1,000.00". */
export function receiptLines(output) {
  return output.results.receipt.map((line) => `${line.label} ${line.value}`);
}

/** The "Owes" column of the Split by order table. */
export function owes(output) {
  return output.results.table.map((row) => row.owes);
}

/** The "Share of tax and tip" column of the Split by order table. */
export function shares(output) {
  return output.results.table.map((row) => row.share);
}

/** The receipt line for the tip, e.g. "Tip (10%) 100.00". */
export function tipLine(output) {
  return receiptLines(output)[2];
}

/** The receipt line for the total, e.g. "Total 1,260.00". */
export function totalLine(output) {
  return receiptLines(output)[3];
}
