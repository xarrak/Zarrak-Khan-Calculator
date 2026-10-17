// Acceptance criteria for the Bill Organiser stories (S-10, S-5, S-6, S-7),
// run through the engine exactly as the screen will use it.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, compute, resetState, addRow, removeRow } from '../src/lib/engine.js';
import * as M from '../src/lib/messages.js';
import { evenState, orderState, receiptLines, owes, shares, tipLine } from './helpers.js';

// The normal case used across S-10, S-6 and S-7: subtotal 100, tax 16, 10%,
// Ali ordered 60 and Sara ordered 40.
const normal = (overrides = {}, rows = [['Ali', '60'], ['Sara', '40']]) =>
  orderState({ subtotal: '100', tax: '16', tipChoice: '10', ...overrides }, rows);

describe('S-10: Enter the receipt amounts when splitting by order', () => {
  test('S-10.1: opening Split by order shows empty receipt fields, 10%, 2 empty rows and "Fill in..."', () => {
    const state = { ...initialState(), mode: 'order' };
    assert.equal(state.subtotal, '');
    assert.equal(state.tax, '');
    assert.equal(state.tipChoice, '10');
    assert.equal(state.rows.length, 2);
    for (const row of state.rows) {
      assert.equal(row.name, '');
      assert.equal(row.ordered, '');
    }
    assert.equal(compute(state).resultsMessage, M.FILL_IN);
  });

  test('S-10.2: the receipt lines are shown, followed by the table', () => {
    const out = compute(normal());
    assert.deepEqual(receiptLines(out), [
      'Subtotal 100.00',
      'Tax and service charges 16.00',
      'Tip (10%) 10.00',
      'Total 126.00',
    ]);
    assert.equal(out.results.table.length, 2);
  });

  test('S-10.3: a custom tip of 12.5 gives Ali 77.10 and Sara 51.40, total 128.50', () => {
    const out = compute(normal({ tipChoice: 'custom', customTip: '12.5' }));
    assert.equal(tipLine(out), 'Tip (12.5%) 12.50');
    assert.equal(receiptLines(out)[3], 'Total 128.50');
    assert.deepEqual(shares(out), ['17.10', '11.40']);
    assert.deepEqual(owes(out), ['77.10', '51.40']);
    assert.deepEqual(out.results.totalRow, { amount: '128.50', note: M.MATCHES_RECEIPT });
  });

  const leaving = (field, value, extra = {}) => compute(normal({ ...extra, [field]: value, left: { [field]: true } }));

  test('S-10.4: subtotal "abc" shows the not-a-number message and no amounts owed', () => {
    const out = leaving('subtotal', 'abc');
    assert.equal(out.fields.subtotal.message, M.NOT_A_NUMBER);
    assert.equal(out.results, null);
  });

  test('S-10.5: subtotal "Rs 100" shows the commas and currency message', () => {
    const out = leaving('subtotal', 'Rs 100');
    assert.equal(out.fields.subtotal.message, M.COMMA_OR_CURRENCY);
    assert.equal(out.results, null);
  });

  test('S-10.6: tax "-5" shows the negative message under the tax field', () => {
    const out = leaving('tax', '-5');
    assert.equal(out.fields.tax.message, M.NEGATIVE);
    assert.equal(out.results, null);
  });

  test('S-10.7: custom tip "ten" shows the tip range message', () => {
    const out = leaving('customTip', 'ten', { tipChoice: 'custom' });
    assert.equal(out.fields.customTip.message, M.TIP_RANGE);
    assert.equal(out.results, null);
  });

  test('S-10.8: at 0%, Ali owes 69.60 and Sara 46.40, total 116.00', () => {
    const out = compute(normal({ tipChoice: '0' }));
    assert.deepEqual(shares(out), ['9.60', '6.40']);
    assert.deepEqual(owes(out), ['69.60', '46.40']);
    assert.equal(out.results.totalRow.amount, '116.00');
  });

  test('S-10.9: subtotal 0 shows "Subtotal must be at least 0.01."', () => {
    assert.equal(leaving('subtotal', '0').fields.subtotal.message, M.SUBTOTAL_MIN);
  });

  test('S-10.10: subtotal 1000000.01 is above the maximum', () => {
    assert.equal(leaving('subtotal', '1000000.01').fields.subtotal.message, M.AMOUNT_MAX);
  });

  test('S-10.11: subtotal 1e15 is not a valid number', () => {
    assert.equal(leaving('subtotal', '1e15').fields.subtotal.message, M.NOT_A_NUMBER);
  });

  test('S-10.12: subtotal 0.001 has too many decimal places', () => {
    assert.equal(leaving('subtotal', '0.001').fields.subtotal.message, M.TOO_MANY_DECIMALS);
  });

  test('S-10.13: at 20%, Ali owes 81.60 and Sara 54.40, total 136.00, matching the receipt', () => {
    const out = compute(normal({ tipChoice: '20' }));
    assert.deepEqual(owes(out), ['81.60', '54.40']);
    assert.deepEqual(out.results.totalRow, { amount: '136.00', note: M.MATCHES_RECEIPT });
  });

  test('S-10.14: a subtotal entered on Split by order is kept on Split evenly', () => {
    const order = orderState({ subtotal: '100' }, ['60', '40']);
    const even = { ...order, mode: 'even' };
    assert.equal(even.subtotal, '100');
    assert.equal(receiptLines(compute(even))[0], 'Subtotal 100.00');
  });

  test('S-10.15: Reset on Split by order clears everything, with no errors, and stays on Split by order', () => {
    const messy = normal({ subtotal: 'abc', left: { subtotal: true } });
    const reset = resetState(messy);
    assert.deepEqual(reset, { ...initialState(), mode: 'order' });
    const out = compute(reset);
    assert.equal(out.fields.subtotal.invalid, false);
    assert.ok(out.rows.every((row) => !row.invalid));
  });
});

describe('S-5: List each person and what they ordered', () => {
  test('S-5.1: switching to Split by order the first time keeps the receipt and shows Person 1 and Person 2', () => {
    const even = evenState({ subtotal: '100', tax: '16', tipChoice: '15', people: '4' });
    const order = { ...even, mode: 'order' };
    assert.equal(order.subtotal, '100');
    assert.equal(order.tax, '16');
    assert.equal(order.tipChoice, '15');
    const out = compute(order);
    assert.deepEqual(out.rows.map((r) => r.label), ['Person 1', 'Person 2']);
    assert.deepEqual(order.rows.map((r) => r.ordered), ['', '']);
  });

  test('S-5.2: switching back to Split evenly still shows 4 people', () => {
    const order = { ...evenState({ people: '4' }), mode: 'order' };
    assert.equal({ ...order, mode: 'even' }.people, '4');
  });

  test('S-5.3: Add person adds an empty row labelled Person 3', () => {
    const state = addRow(orderState({}, ['', '']));
    assert.equal(state.rows.length, 3);
    assert.equal(state.rows[2].ordered, '');
    assert.equal(compute(state).rows[2].label, 'Person 3');
  });

  test('S-5.4: removing the second of three unnamed rows renumbers the rest and keeps their amounts', () => {
    const state = removeRow(orderState({}, ['10', '20', '30']), 2);
    assert.deepEqual(state.rows.map((r) => r.ordered), ['10', '30']);
    assert.deepEqual(compute(state).rows.map((r) => r.label), ['Person 1', 'Person 2']);
  });

  test('S-5.5: a row named Ali is labelled Ali; clearing the name makes it Person 1 again', () => {
    assert.equal(compute(orderState({}, [['Ali', '60']])).rows[0].label, 'Ali');
    assert.equal(compute(orderState({}, [['', '60']])).rows[0].label, 'Person 1');
  });

  test('S-5.6: a name of only spaces is labelled Person 1', () => {
    assert.equal(compute(orderState({}, [['   ', '60']])).rows[0].label, 'Person 1');
  });

  test('S-5.7: switching to Split evenly and back keeps rows, names and amounts', () => {
    const order = normal();
    const back = { ...{ ...order, mode: 'even' }, mode: 'order' };
    assert.deepEqual(back.rows, order.rows);
    assert.deepEqual(owes(compute(back)), ['75.60', '50.40']);
  });

  const leavingRow = (value) =>
    compute(normal({ left: { 'ordered:2': true } }, [['Ali', '60'], ['Sara', value]]));

  test('S-5.8: leaving an ordered amount empty shows "Enter what this person ordered (at least 0.01)."', () => {
    const out = leavingRow('');
    assert.equal(out.rows[1].message, M.ORDERED_MIN);
    assert.equal(out.results, null);
  });

  test('S-5.9: an ordered amount of "abc" is not a valid number', () => {
    const out = leavingRow('abc');
    assert.equal(out.rows[1].message, M.NOT_A_NUMBER);
    assert.equal(out.results, null);
  });

  test('S-5.10: 1,200, Rs 1200 and 1200pkr get the commas and currency message', () => {
    for (const value of ['1,200', 'Rs 1200', '1200pkr']) {
      const out = leavingRow(value);
      assert.equal(out.rows[1].message, M.COMMA_OR_CURRENCY, value);
      assert.equal(out.results, null, value);
    }
  });

  test('S-5.11: an ordered amount of -5 is negative', () => {
    const out = leavingRow('-5');
    assert.equal(out.rows[1].message, M.NEGATIVE);
    assert.equal(out.results, null);
  });

  test('S-5.12: the name "Khan, Ali" is shown as typed', () => {
    assert.equal(compute(orderState({}, [['Khan, Ali', '60']])).rows[0].label, 'Khan, Ali');
  });

  test('S-5.13: an ordered amount of 0 shows the ordered-amount message', () => {
    assert.equal(leavingRow('0').rows[1].message, M.ORDERED_MIN);
  });

  const oneRow = (subtotal, ordered) => compute(orderState({ subtotal, left: { 'ordered:1': true } }, [ordered]));

  test('S-5.14: subtotal 0.01 and one row of 0.01 shows Ordered 0.01 with no error', () => {
    const out = oneRow('0.01', '0.01');
    assert.equal(out.rows[0].message, null);
    assert.equal(out.results.table[0].ordered, '0.01');
  });

  test('S-5.15: subtotal 1 and one row of 1 shows Ordered 1.00 with no error', () => {
    const out = oneRow('1', '1');
    assert.equal(out.rows[0].message, null);
    assert.equal(out.results.table[0].ordered, '1.00');
  });

  test('S-5.16: subtotal 1000000 and one row of 1000000 shows Ordered 1,000,000.00 with no error', () => {
    const out = oneRow('1000000', '1000000');
    assert.equal(out.rows[0].message, null);
    assert.equal(out.results.table[0].ordered, '1,000,000.00');
  });

  test('S-5.17: an ordered amount of 1000000.01 is above the maximum', () => {
    assert.equal(leavingRow('1000000.01').rows[1].message, M.AMOUNT_MAX);
  });

  test('S-5.18: with one row left, Remove is disabled and removing does nothing', () => {
    const state = orderState({}, ['10']);
    assert.equal(compute(state).controls.canRemoveRow, false);
    assert.equal(removeRow(state, 1), state);
  });

  test('S-5.19: with 50 rows, Add person is disabled and "Up to 50 people." is shown', () => {
    const state = orderState({}, Array.from({ length: 50 }, () => '1'));
    const out = compute(state);
    assert.equal(out.controls.canAddRow, false);
    assert.equal(out.controls.addRowNote, M.MAX_PEOPLE_NOTE);
    assert.equal(addRow(state), state);
    assert.equal(compute(orderState({}, ['1', '1'])).controls.addRowNote, null);
  });

  test('S-5.21: an ordered amount of 1e15 is not a valid number', () => {
    assert.equal(leavingRow('1e15').rows[1].message, M.NOT_A_NUMBER);
  });

  test('S-5.22: an ordered amount of 1000000000000000 is above the maximum', () => {
    assert.equal(leavingRow('1000000000000000').rows[1].message, M.AMOUNT_MAX);
  });

  test('S-5.23: an ordered amount of 0.001 has too many decimal places', () => {
    assert.equal(leavingRow('0.001').rows[1].message, M.TOO_MANY_DECIMALS);
  });

  test('S-5.25: removing a third row that shows an error brings the results back', () => {
    const state = normal({ left: { 'ordered:3': true } }, [['Ali', '60'], ['Sara', '40'], ['', 'abc']]);
    assert.equal(compute(state).results, null);
    const out = compute(removeRow(state, 3));
    assert.deepEqual(owes(out), ['75.60', '50.40']);
  });

  test('S-5.26: correcting Sara from -5 to 40 clears the error and shows results', () => {
    assert.equal(leavingRow('-5').rows[1].message, M.NEGATIVE);
    const out = leavingRow('40');
    assert.equal(out.rows[1].message, null);
    assert.notEqual(out.results, null);
  });

  test('S-5.27: Reset on Split by order keeps Split by order and returns 2 empty unnamed rows', () => {
    const reset = resetState(normal());
    assert.equal(reset.mode, 'order');
    assert.deepEqual(reset.rows, initialState().rows);
  });
});

describe('S-6: See what each person owes, with tax and tip shared in proportion', () => {
  test('S-6.1: Ali owes 75.60 and Sara 50.40, total 126.00, matching the receipt', () => {
    const out = compute(normal());
    assert.deepEqual(out.results.table.map(({ label, ordered, share, owes: o }) => [label, ordered, share, o]), [
      ['Ali', '60.00', '15.60', '75.60'],
      ['Sara', '40.00', '10.40', '50.40'],
    ]);
    assert.deepEqual(out.results.totalRow, { amount: '126.00', note: M.MATCHES_RECEIPT });
  });

  test('S-6.2: three equal orders of 10 share 1.00 as 0.34, 0.33, 0.33 (tie to the higher row)', () => {
    const out = compute(orderState({ subtotal: '30', tax: '1', tipChoice: '0' }, ['10', '10', '10']));
    assert.deepEqual(owes(out), ['10.34', '10.33', '10.33']);
    assert.equal(out.results.totalRow.amount, '31.00');
  });

  test('S-6.3: an invalid subtotal hides all amounts owed and shows "Fix..."', () => {
    const out = compute(normal({ subtotal: 'abc' }));
    assert.equal(out.results, null);
    assert.equal(out.resultsMessage, M.FIX_FIELDS);
  });

  test('S-6.4: pasting "Rs 60" for Ali shows the commas and currency message and no amounts owed', () => {
    const out = compute(normal({ left: { 'ordered:1': true } }, [['Ali', 'Rs 60'], ['Sara', '40']]));
    assert.equal(out.rows[0].message, M.COMMA_OR_CURRENCY);
    assert.equal(out.results, null);
  });

  test('S-6.5: with no tax and 0% tip, each owes exactly what they ordered', () => {
    const out = compute(normal({ tax: '', tipChoice: '0' }));
    assert.deepEqual(shares(out), ['0.00', '0.00']);
    assert.deepEqual(owes(out), ['60.00', '40.00']);
  });

  test('S-6.6: one person who ordered the whole subtotal owes the whole receipt total, 126.00', () => {
    assert.deepEqual(owes(compute(normal({}, ['100']))), ['126.00']);
  });

  test('S-6.7: orders of 0.01 and 99.99 at 15% owe 0.01 and 114.99 (larger remainder gets the cent)', () => {
    const out = compute(orderState({ subtotal: '100', tipChoice: '15' }, ['0.01', '99.99']));
    assert.deepEqual(shares(out), ['0.00', '15.00']);
    assert.deepEqual(owes(out), ['0.01', '114.99']);
    assert.equal(out.results.totalRow.amount, '115.00');
  });

  test('S-6.8: 50 orders of 0.01 with tax 0.01: Person 1 owes 0.02, the rest 0.01, total 0.51', () => {
    const out = compute(orderState({ subtotal: '0.50', tax: '0.01', tipChoice: '0' }, Array(50).fill('0.01')));
    const amounts = owes(out);
    assert.equal(amounts[0], '0.02');
    assert.ok(amounts.slice(1).every((a) => a === '0.01'));
    assert.equal(out.results.totalRow.amount, '0.51');
  });

  const hundredPercent = (subtotal, tax, rows) =>
    compute(orderState({ subtotal, tax, tipChoice: 'custom', customTip: '100' }, rows));

  test('S-6.9: the largest values: Person 1 owes 2,999,999.97 and Person 2 0.03, total 3,000,000.00', () => {
    const out = hundredPercent('1000000', '1000000', ['999999.99', '0.01']);
    assert.deepEqual(shares(out), ['1,999,999.98', '0.02']);
    assert.deepEqual(owes(out), ['2,999,999.97', '0.03']);
    assert.deepEqual(out.results.totalRow, { amount: '3,000,000.00', note: M.MATCHES_RECEIPT });
  });

  test('S-6.10: a tied leftover cent with large values goes to Person 1 (2,142,925.88), not Person 2', () => {
    const out = hundredPercent('960811.70', '459405.35', ['864730.53', '96081.17']);
    assert.deepEqual(shares(out), ['1,278,195.35', '142,021.70']);
    assert.deepEqual(owes(out), ['2,142,925.88', '238,102.87']);
    assert.deepEqual(out.results.totalRow, { amount: '2,381,028.75', note: M.MATCHES_RECEIPT });
  });

  test('S-6.11: three orders of 0.01 with tax 0.01 owe 0.02, 0.01, 0.01, total 0.04', () => {
    const out = compute(orderState({ subtotal: '0.03', tax: '0.01', tipChoice: '0' }, ['0.01', '0.01', '0.01']));
    assert.deepEqual(owes(out), ['0.02', '0.01', '0.01']);
    assert.equal(out.results.totalRow.amount, '0.04');
  });

  test('S-6.12: changing Ali and Sara to 50 each gives each 13.00 and 63.00, total 126.00', () => {
    const out = compute(normal({}, [['Ali', '50'], ['Sara', '50']]));
    assert.deepEqual(shares(out), ['13.00', '13.00']);
    assert.deepEqual(owes(out), ['63.00', '63.00']);
    assert.deepEqual(out.results.totalRow, { amount: '126.00', note: M.MATCHES_RECEIPT });
  });

  test('S-6.13: removing the second of three orders of 10 leaves two owing 10.50, with the S-7 warning', () => {
    const state = removeRow(orderState({ subtotal: '30', tax: '1', tipChoice: '0' }, ['10', '10', '10']), 2);
    const out = compute(state);
    assert.deepEqual(out.rows.map((r) => r.label), ['Person 1', 'Person 2']);
    assert.deepEqual(shares(out), ['0.50', '0.50']);
    assert.deepEqual(owes(out), ['10.50', '10.50']);
    assert.equal(out.results.totalRow.amount, '21.00');
    assert.equal(
      out.results.warning,
      'The amounts entered add up to 20.00, but the receipt subtotal is 30.00. 10.00 is not assigned to anyone.',
    );
  });

  test('S-6.14: Ali "abc" hides the amounts owed; correcting to 60 brings back 75.60 and 50.40', () => {
    assert.equal(compute(normal({}, [['Ali', 'abc'], ['Sara', '40']])).results, null);
    assert.deepEqual(owes(compute(normal())), ['75.60', '50.40']);
  });
});

describe('S-7: Be warned when the amounts don\'t cover the bill', () => {
  test('S-7.1: orders of 60 and 30 against 100 warn that 10.00 is not assigned', () => {
    const out = compute(normal({}, [['Ali', '60'], ['Sara', '30']]));
    assert.equal(
      out.results.warning,
      'The amounts entered add up to 90.00, but the receipt subtotal is 100.00. 10.00 is not assigned to anyone.',
    );
    assert.deepEqual(owes(out), ['77.33', '38.67']);
    assert.deepEqual(out.results.totalRow, { amount: '116.00', note: '10.00 less than the receipt total of 126.00.' });
  });

  test('S-7.2: orders of 60 and 50 against 100 warn of 10.00 too much', () => {
    const out = compute(normal({}, [['Ali', '60'], ['Sara', '50']]));
    assert.equal(
      out.results.warning,
      'The amounts entered add up to 110.00, which is 10.00 more than the receipt subtotal of 100.00. Check for an item entered twice.',
    );
    assert.deepEqual(owes(out), ['74.18', '61.82']);
    assert.deepEqual(out.results.totalRow, { amount: '136.00', note: '10.00 more than the receipt total of 126.00.' });
  });

  test('S-7.3: orders that add up to the subtotal show no warning and "Matches the receipt total."', () => {
    const out = compute(normal());
    assert.equal(out.results.warning, null);
    assert.equal(out.results.totalRow.note, M.MATCHES_RECEIPT);
  });

  test('S-7.4: changing Sara to "abc" hides the warning and the amounts owed, and shows "Fix..."', () => {
    const out = compute(normal({}, [['Ali', '60'], ['Sara', 'abc']]));
    assert.equal(out.results, null);
    assert.equal(out.resultsMessage, M.FIX_FIELDS);
  });

  test('S-7.5: orders of 60 and 39.99 warn that 0.01 is not assigned', () => {
    const out = compute(orderState({ subtotal: '100', tipChoice: '0' }, ['60', '39.99']));
    assert.equal(
      out.results.warning,
      'The amounts entered add up to 99.99, but the receipt subtotal is 100.00. 0.01 is not assigned to anyone.',
    );
    assert.deepEqual(out.results.totalRow, { amount: '99.99', note: '0.01 less than the receipt total of 100.00.' });
  });

  test('S-7.6: orders of 60 and 40 against 100 show no warning', () => {
    assert.equal(compute(orderState({ subtotal: '100', tipChoice: '0' }, ['60', '40'])).results.warning, null);
  });

  test('S-7.7: two orders of 1000000 against 1000000 warn of 1,000,000.00 too much', () => {
    const out = compute(orderState({ subtotal: '1000000', tipChoice: '0' }, ['1000000', '1000000']));
    assert.equal(
      out.results.warning,
      'The amounts entered add up to 2,000,000.00, which is 1,000,000.00 more than the receipt subtotal of 1,000,000.00. Check for an item entered twice.',
    );
    assert.deepEqual(out.results.totalRow, {
      amount: '2,000,000.00',
      note: '1,000,000.00 more than the receipt total of 1,000,000.00.',
    });
  });

  test('S-7.8: one order of 0.01 against 0.02 warns that 0.01 is not assigned', () => {
    const out = compute(orderState({ subtotal: '0.02', tipChoice: '0' }, ['0.01']));
    assert.equal(
      out.results.warning,
      'The amounts entered add up to 0.01, but the receipt subtotal is 0.02. 0.01 is not assigned to anyone.',
    );
    assert.deepEqual(out.results.totalRow, { amount: '0.01', note: '0.01 less than the receipt total of 0.02.' });
  });

  test('S-7.9: correcting Sara from 30 to 40 removes the warning and matches the receipt', () => {
    const out = compute(normal());
    assert.equal(out.results.warning, null);
    assert.deepEqual(owes(out), ['75.60', '50.40']);
    assert.deepEqual(out.results.totalRow, { amount: '126.00', note: M.MATCHES_RECEIPT });
  });

  test('S-7.10: removing the third of 50 / 30 / 20 warns that 20.00 is not assigned', () => {
    const before = normal({}, ['50', '30', '20']);
    assert.equal(compute(before).results.warning, null);
    const out = compute(removeRow(before, 3));
    assert.equal(
      out.results.warning,
      'The amounts entered add up to 80.00, but the receipt subtotal is 100.00. 20.00 is not assigned to anyone.',
    );
    assert.deepEqual(owes(out), ['66.25', '39.75']);
    assert.deepEqual(out.results.totalRow, { amount: '106.00', note: '20.00 less than the receipt total of 126.00.' });
  });

  test('S-7.11: changing the subtotal to 95 updates the warning, tip 9.50, owing 77.00 and 38.50', () => {
    const out = compute(normal({ subtotal: '95' }, [['Ali', '60'], ['Sara', '30']]));
    assert.equal(
      out.results.warning,
      'The amounts entered add up to 90.00, but the receipt subtotal is 95.00. 5.00 is not assigned to anyone.',
    );
    assert.equal(tipLine(out), 'Tip (10%) 9.50');
    assert.deepEqual(owes(out), ['77.00', '38.50']);
    assert.equal(out.results.totalRow.note, '5.00 less than the receipt total of 120.50.');
  });

  test('S-7.12: then changing the subtotal to 90 removes the warning: tip 9.00, owing 76.67 and 38.33', () => {
    const out = compute(normal({ subtotal: '90' }, [['Ali', '60'], ['Sara', '30']]));
    assert.equal(out.results.warning, null);
    assert.equal(tipLine(out), 'Tip (10%) 9.00');
    assert.deepEqual(owes(out), ['76.67', '38.33']);
    assert.deepEqual(out.results.totalRow, { amount: '115.00', note: M.MATCHES_RECEIPT });
  });
});
