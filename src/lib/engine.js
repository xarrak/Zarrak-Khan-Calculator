// The engine: turns the raw state of the form into everything the screen
// shows: which fields are outlined, which messages appear, and the exact
// result lines. It is pure: no DOM, no side effects. The UI only copies its
// output onto the page (technical plan: "Architecture").

import { parseMoney, parseTip, parsePeople, personLabel } from './validate.js';
import { tipCents, evenSplit, allocateExtra } from './calc.js';
import { formatCents, formatPercent } from './money.js';
import * as M from './messages.js';

export const MAX_ROWS = 50;
export const TIP_PRESETS = ['0', '10', '15', '20'];

/**
 * The state of the form.
 * @typedef {{ id: number, name: string, ordered: string }} Row
 * @typedef {{
 *   mode: 'even' | 'order',
 *   subtotal: string, tax: string,
 *   tipChoice: '0' | '10' | '15' | '20' | 'custom', customTip: string,
 *   people: string,
 *   rows: Row[], nextRowId: number,
 *   left: Record<string, boolean>
 * }} State
 * `left` marks the fields whose error message may show: a field is marked
 * when the user leaves it, and the mark is cleared by editField() as soon as
 * its value is valid again. So a message appears only when the field is left,
 * then updates while the user types, and once it has gone, the next mistake
 * waits until the field is left again (shared definitions: "Validation timing").
 * Keys are 'subtotal', 'tax', 'customTip', 'people' and 'ordered:<row id>'.
 */

/** The state when the page opens (S-1.1). */
export function initialState() {
  return {
    mode: 'even',
    subtotal: '',
    tax: '',
    tipChoice: '10',
    customTip: '',
    people: '2',
    rows: [
      { id: 1, name: '', ordered: '' },
      { id: 2, name: '', ordered: '' },
    ],
    nextRowId: 3,
    left: {},
  };
}

/** Reset: everything back to the opening state, keeping the current mode (D-12). */
export function resetState(state) {
  return { ...initialState(), mode: state.mode };
}

/** Add an empty unnamed row at the end of the list, up to 50 rows. */
export function addRow(state) {
  if (state.rows.length >= MAX_ROWS) return state;
  return {
    ...state,
    rows: [...state.rows, { id: state.nextRowId, name: '', ordered: '' }],
    nextRowId: state.nextRowId + 1,
  };
}

/** Remove a row by id. The last remaining row cannot be removed. */
export function removeRow(state, id) {
  if (state.rows.length <= 1) return state;
  const left = { ...state.left };
  delete left[`ordered:${id}`];
  return { ...state, rows: state.rows.filter((row) => row.id !== id), left };
}

/** Validate one field of the state by its key. */
function validateField(state, key) {
  if (key === 'subtotal') return parseMoney(state.subtotal, 'subtotal');
  if (key === 'tax') return parseMoney(state.tax, 'tax');
  if (key === 'customTip') return parseTip(state.customTip);
  if (key === 'people') return parsePeople(state.people);
  if (key.startsWith('ordered:')) {
    const row = state.rows.find((r) => `ordered:${r.id}` === key);
    return row ? parseMoney(row.ordered, 'ordered') : { ok: true };
  }
  return { ok: true };
}

/**
 * The user typed in a field: store the new text. If the value is now valid,
 * clear the field's `left` mark, so its next error waits until it is left again.
 * @param {State} state
 * @param {string} key 'subtotal', 'tax', 'customTip', 'people' or 'ordered:<row id>'
 * @param {string} value the field's new text
 */
export function editField(state, key, value) {
  const next = key.startsWith('ordered:')
    ? { ...state, rows: state.rows.map((r) => (`ordered:${r.id}` === key ? { ...r, ordered: value } : r)) }
    : { ...state, [key]: value };
  if (next.left?.[key] && validateField(next, key).ok) {
    const left = { ...next.left };
    delete left[key];
    return { ...next, left };
  }
  return next;
}

/**
 * The user left a field. Mark it only if its value has a problem (invalid, or
 * a required field left empty), so that its message appears now. A valid
 * field is not marked, so a later mistake waits until it is left again.
 * @param {State} state
 * @param {string} key
 */
export function leaveField(state, key) {
  if (validateField(state, key).ok || state.left?.[key]) return state;
  return { ...state, left: { ...state.left, [key]: true } };
}

/** Field status from a validation result and whether the user has left the field. */
function fieldStatus(result, hasLeft) {
  if (result.ok) return { invalid: false, message: null, waiting: false };
  // A required field that is empty and has never been left is not an error yet.
  if (result.empty && !hasLeft) return { invalid: false, message: null, waiting: true };
  // An invalid value is outlined straight away; its message appears once the field has been left.
  return { invalid: true, message: hasLeft ? result.message : null, waiting: false };
}

const CLEAR = { invalid: false, message: null, waiting: false };

/**
 * Compute everything the screen shows for a given state.
 * @param {State} state
 */
export function compute(state) {
  const left = state.left ?? {};
  const fields = { subtotal: CLEAR, tax: CLEAR, customTip: CLEAR, people: CLEAR };

  // Receipt fields, shared by both modes.
  const subtotal = parseMoney(state.subtotal, 'subtotal');
  fields.subtotal = fieldStatus(subtotal, left.subtotal);
  const tax = parseMoney(state.tax, 'tax');
  fields.tax = fieldStatus(tax, left.tax);

  let tip;
  if (state.tipChoice === 'custom') {
    tip = parseTip(state.customTip);
    fields.customTip = fieldStatus(tip, left.customTip);
  } else {
    tip = { ok: true, value: BigInt(state.tipChoice) * 100n };
  }

  // Mode-specific fields.
  let people = null;
  const rowResults = [];
  const rows = state.rows.map((row, index) => {
    const result = parseMoney(row.ordered, 'ordered');
    rowResults.push(result);
    return {
      id: row.id,
      label: personLabel(row.name, index + 1),
      ...(state.mode === 'order' ? fieldStatus(result, left[`ordered:${row.id}`]) : CLEAR),
    };
  });
  if (state.mode === 'even') {
    people = parsePeople(state.people);
    fields.people = fieldStatus(people, left.people);
  }

  const controls = {
    canAddRow: state.rows.length < MAX_ROWS,
    canRemoveRow: state.rows.length > 1,
    addRowNote: state.rows.length >= MAX_ROWS ? M.MAX_PEOPLE_NOTE : null,
  };

  // What the results area shows.
  const statuses = [fields.subtotal, fields.tax, fields.customTip, fields.people];
  if (state.mode === 'order') statuses.push(...rows);
  const anyInvalid = statuses.some((s) => s.invalid);
  const anyWaiting = statuses.some((s) => s.waiting);

  const base = { fields, rows, controls };
  if (anyInvalid) return { ...base, resultsMessage: M.FIX_FIELDS, results: null };
  if (anyWaiting) return { ...base, resultsMessage: M.FILL_IN, results: null };

  // Every input is valid: calculate.
  const S = subtotal.value;
  const X = tax.value;
  const tipAmount = tipCents(S, tip.value);
  const T = S + X + tipAmount;
  const receipt = [
    { label: M.LABEL_SUBTOTAL, value: formatCents(S) },
    { label: M.LABEL_TAX, value: formatCents(X) },
    { label: M.labelTip(formatPercent(tip.value)), value: formatCents(tipAmount) },
    { label: M.LABEL_TOTAL, value: formatCents(T) },
  ];

  if (state.mode === 'even') {
    const n = people.value;
    const { base: share, higherCount, lowerCount } = evenSplit(T, n);
    const split =
      higherCount === 0n
        ? [M.eachPays(formatCents(share))]
        : [M.groupPays(higherCount, formatCents(share + 1n)), M.groupPays(lowerCount, formatCents(share))];
    split.push(M.sharesAddUp(n, formatCents(T)));
    return { ...base, resultsMessage: null, results: { receipt, split } };
  }

  // Split by order.
  const ordered = rowResults.map((r) => r.value);
  const shares = allocateExtra(ordered, X + tipAmount);
  const owes = ordered.map((o, i) => o + shares[i]);
  const table = rows.map((row, i) => ({
    id: row.id,
    label: row.label,
    ordered: formatCents(ordered[i]),
    share: formatCents(shares[i]),
    owes: formatCents(owes[i]),
  }));

  const A = ordered.reduce((a, b) => a + b, 0n);
  const totalOwed = owes.reduce((a, b) => a + b, 0n);
  let warning = null;
  let note;
  if (A === S) {
    note = M.MATCHES_RECEIPT;
  } else if (A < S) {
    warning = M.warningBelow(formatCents(A), formatCents(S), formatCents(S - A));
    note = M.totalBelow(formatCents(T - totalOwed), formatCents(T));
  } else {
    warning = M.warningAbove(formatCents(A), formatCents(A - S), formatCents(S));
    note = M.totalAbove(formatCents(totalOwed - T), formatCents(T));
  }

  return {
    ...base,
    resultsMessage: null,
    results: { receipt, table, totalRow: { amount: formatCents(totalOwed), note }, warning },
  };
}
