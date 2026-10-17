// Acceptance criteria for the Diner stories (S-1, S-2, S-3), run through the
// engine exactly as the screen will use it. "When I leave the field" is
// modelled by marking the field in `left`.

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, compute, resetState, editField, leaveField } from '../src/lib/engine.js';
import * as M from '../src/lib/messages.js';
import { evenState, receiptLines, tipLine, totalLine } from './helpers.js';

const run = (overrides) => compute(evenState(overrides));
const leaving = (field, value, extra = {}) =>
  run({ subtotal: '1000', ...extra, [field]: value, left: { [field]: true } });

describe('S-1: Enter the receipt amounts', () => {
  test('S-1.1: on opening, Split evenly, empty receipt fields, 10%, 2 people, "Fill in..." message', () => {
    const state = initialState();
    assert.equal(state.mode, 'even');
    assert.equal(state.subtotal, '');
    assert.equal(state.tax, '');
    assert.equal(state.tipChoice, '10');
    assert.equal(state.people, '2');
    const out = compute(state);
    assert.equal(out.resultsMessage, M.FILL_IN);
    assert.equal(out.results, null);
    assert.equal(out.fields.subtotal.invalid, false);
    assert.equal(out.fields.subtotal.message, null);
  });

  test('S-1.2: subtotal 1000 and tax 160 show the four receipt lines in order', () => {
    assert.deepEqual(receiptLines(run({ subtotal: '1000', tax: '160' })), [
      'Subtotal 1,000.00',
      'Tax and service charges 160.00',
      'Tip (10%) 100.00',
      'Total 1,260.00',
    ]);
  });

  test('S-1.3: an empty tax field shows "Tax and service charges 0.00"', () => {
    assert.equal(receiptLines(run({ subtotal: '1000', tax: '' }))[1], 'Tax and service charges 0.00');
  });

  test('S-1.4: spaces around the subtotal are ignored', () => {
    assert.equal(receiptLines(run({ subtotal: ' 1000.50 ' }))[0], 'Subtotal 1,000.50');
  });

  test('S-1.5: ".5", "12." and "007" show as 0.50, 12.00 and 7.00', () => {
    assert.equal(receiptLines(run({ subtotal: '.5' }))[0], 'Subtotal 0.50');
    assert.equal(receiptLines(run({ subtotal: '12.' }))[0], 'Subtotal 12.00');
    assert.equal(receiptLines(run({ subtotal: '007' }))[0], 'Subtotal 7.00');
  });

  test('S-1.6: leaving the subtotal empty shows "Enter the bill subtotal." and "Fix..."', () => {
    const out = leaving('subtotal', '');
    assert.equal(out.fields.subtotal.message, M.SUBTOTAL_EMPTY);
    assert.equal(out.fields.subtotal.invalid, true);
    assert.equal(out.resultsMessage, M.FIX_FIELDS);
    assert.equal(out.results, null);
  });

  test('S-1.7: abc, 12abc, +5 and 10.0.5 are not valid numbers', () => {
    for (const value of ['abc', '12abc', '+5', '10.0.5']) {
      const out = leaving('subtotal', value);
      assert.equal(out.fields.subtotal.message, M.NOT_A_NUMBER, value);
      assert.equal(out.results, null, value);
    }
  });

  test('S-1.8: pasted commas and currency symbols or codes are rejected with their own message', () => {
    for (const value of ['1,250.50', 'Rs 1250', 'rs1250', '1250Rs', '$1250', '1250 PKR', '₨1,250']) {
      const out = leaving('subtotal', value);
      assert.equal(out.fields.subtotal.message, M.COMMA_OR_CURRENCY, value);
      assert.equal(out.results, null, value);
    }
  });

  test('S-1.9: a negative subtotal shows "Amount can\'t be negative."', () => {
    const out = leaving('subtotal', '-20');
    assert.equal(out.fields.subtotal.message, M.NEGATIVE);
    assert.equal(out.results, null);
  });

  test('S-1.10: tax "abc" shows the not-a-number message under the tax field', () => {
    const out = leaving('tax', 'abc');
    assert.equal(out.fields.tax.message, M.NOT_A_NUMBER);
    assert.equal(out.results, null);
  });

  test('S-1.11: tax "-5" shows the negative message under the tax field', () => {
    const out = leaving('tax', '-5');
    assert.equal(out.fields.tax.message, M.NEGATIVE);
    assert.equal(out.results, null);
  });

  test('S-1.12: tax "Rs 160" shows the commas and currency message under the tax field', () => {
    const out = leaving('tax', 'Rs 160');
    assert.equal(out.fields.tax.message, M.COMMA_OR_CURRENCY);
    assert.equal(out.results, null);
  });

  test('S-1.13: a subtotal of 0 or 0.00 shows "Subtotal must be at least 0.01."', () => {
    for (const value of ['0', '0.00']) {
      const out = leaving('subtotal', value);
      assert.equal(out.fields.subtotal.message, M.SUBTOTAL_MIN, value);
      assert.equal(out.results, null, value);
    }
  });

  test('S-1.14: subtotal 0.01 shows "Subtotal 0.01"', () => {
    assert.equal(receiptLines(run({ subtotal: '0.01' }))[0], 'Subtotal 0.01');
  });

  test('S-1.15: subtotal 1 shows "Subtotal 1.00"', () => {
    assert.equal(receiptLines(run({ subtotal: '1' }))[0], 'Subtotal 1.00');
  });

  test('S-1.16: subtotal 1000000 shows "Subtotal 1,000,000.00"', () => {
    assert.equal(receiptLines(run({ subtotal: '1000000' }))[0], 'Subtotal 1,000,000.00');
  });

  test('S-1.17: subtotal 1000000.01 is above the maximum', () => {
    const out = leaving('subtotal', '1000000.01');
    assert.equal(out.fields.subtotal.message, M.AMOUNT_MAX);
    assert.equal(out.results, null);
  });

  test('S-1.18: tax 0 is accepted and shows 0.00', () => {
    const out = run({ subtotal: '1', tax: '0', left: { tax: true } });
    assert.equal(out.fields.tax.message, null);
    assert.equal(receiptLines(out)[1], 'Tax and service charges 0.00');
  });

  test('S-1.19: tax 1000000 is accepted, with total 1,000,001.10', () => {
    const out = run({ subtotal: '1', tax: '1000000', left: { tax: true } });
    assert.equal(out.fields.tax.message, null);
    assert.equal(receiptLines(out)[1], 'Tax and service charges 1,000,000.00');
    assert.equal(totalLine(out), 'Total 1,000,001.10');
  });

  test('S-1.20: tax 1000000.01 is above the maximum', () => {
    const out = run({ subtotal: '1', tax: '1000000.01', left: { tax: true } });
    assert.equal(out.fields.tax.message, M.AMOUNT_MAX);
    assert.equal(out.results, null);
  });

  test('S-1.21: subtotal 1e15 is not a valid number', () => {
    assert.equal(leaving('subtotal', '1e15').fields.subtotal.message, M.NOT_A_NUMBER);
  });

  test('S-1.22: subtotal 1000000000000000 is above the maximum', () => {
    assert.equal(leaving('subtotal', '1000000000000000').fields.subtotal.message, M.AMOUNT_MAX);
  });

  test('S-1.23: subtotal 0.001 or 10.555 has too many decimal places', () => {
    for (const value of ['0.001', '10.555']) {
      assert.equal(leaving('subtotal', value).fields.subtotal.message, M.TOO_MANY_DECIMALS, value);
    }
  });

  test('S-1.24: tax 0.001 has too many decimal places', () => {
    assert.equal(leaving('tax', '0.001').fields.tax.message, M.TOO_MANY_DECIMALS);
  });

  test('S-1.25: correcting the subtotal to 1000 clears the error and shows results', () => {
    assert.equal(leaving('subtotal', 'abc').fields.subtotal.message, M.NOT_A_NUMBER);
    const out = leaving('subtotal', '1000');
    assert.equal(out.fields.subtotal.message, null);
    assert.equal(out.fields.subtotal.invalid, false);
    assert.notEqual(out.results, null);
  });

  test('S-1.26: "100a" hides results and outlines the field before leaving; the message appears on leaving', () => {
    const typing = run({ subtotal: '100a' }); // not left yet
    assert.equal(typing.results, null);
    assert.equal(typing.fields.subtotal.invalid, true);
    assert.equal(typing.fields.subtotal.message, null);
    assert.equal(typing.resultsMessage, M.FIX_FIELDS);
    const afterLeaving = run({ subtotal: '100a', left: { subtotal: true } });
    assert.equal(afterLeaving.fields.subtotal.message, M.NOT_A_NUMBER);
  });

  test('S-1.26: after a valid value was left, typing "a" waits for the field to be left again before the message shows', () => {
    // The user typed 1000, left the field (no message: 1000 is valid), came back and typed "a".
    let state = editField(evenState(), 'subtotal', '1000');
    state = leaveField(state, 'subtotal'); // left the field with a valid value
    state = editField(state, 'subtotal', '1000a'); // came back and typed "a"
    const typing = compute(state);
    assert.equal(typing.fields.subtotal.invalid, true);
    assert.equal(typing.fields.subtotal.message, null);
    assert.equal(typing.results, null);
    const afterLeaving = compute(leaveField(state, 'subtotal'));
    assert.equal(afterLeaving.fields.subtotal.message, M.NOT_A_NUMBER);
  });

  test('S-1.25: a message that is showing updates as I type, and disappears once the value is valid', () => {
    let state = evenState({ subtotal: 'abc', left: { subtotal: true } }); // message showing
    state = editField(state, 'subtotal', '-1');
    assert.equal(compute(state).fields.subtotal.message, M.NEGATIVE); // updates while typing
    state = editField(state, 'subtotal', '1000');
    assert.equal(compute(state).fields.subtotal.message, null); // gone
  });

  test('S-1.27: after "abc", changing the subtotal to 500 shows "Subtotal 500.00"', () => {
    assert.equal(run({ subtotal: 'abc' }).results, null);
    assert.equal(receiptLines(run({ subtotal: '500' }))[0], 'Subtotal 500.00');
  });

  test('S-1.28: with subtotal and tax both invalid, fixing only the subtotal still shows no results', () => {
    const left = { subtotal: true, tax: true };
    assert.equal(run({ subtotal: 'abc', tax: 'abc', left }).results, null);
    const halfFixed = run({ subtotal: '100', tax: 'abc', left });
    assert.equal(halfFixed.results, null);
    assert.equal(halfFixed.resultsMessage, M.FIX_FIELDS);
    assert.notEqual(run({ subtotal: '100', tax: '16', left }).results, null);
  });

  test('S-1.29: Reset on Split evenly returns to the opening state with no errors', () => {
    const messy = evenState({ subtotal: 'abc', tax: '-5', tipChoice: 'custom', customTip: 'x', people: '0',
      left: { subtotal: true, tax: true, customTip: true, people: true } });
    const reset = resetState(messy);
    assert.deepEqual(reset, initialState());
    const out = compute(reset);
    for (const field of Object.values(out.fields)) assert.equal(field.invalid, false);
    assert.equal(out.resultsMessage, M.FILL_IN);
  });

  // Found in QA testing (added 18 Oct 2026)

  test('S-1.30: "12,50" and ",5" ask for a decimal point; "1,250" still gets the commas message', () => {
    for (const value of ['12,50', ',5']) {
      const out = leaving('subtotal', value);
      assert.equal(out.fields.subtotal.message, M.DECIMAL_COMMA, value);
      assert.equal(out.results, null, value);
    }
    assert.equal(leaving('subtotal', '1,250').fields.subtotal.message, M.COMMA_OR_CURRENCY);
  });

  test('S-1.31: "1 000" and "1 000.50" with a no-break space get "Remove the spaces, e.g. 1250.50."', () => {
    for (const value of ['1 000', '1 000.50']) {
      const out = leaving('subtotal', value);
      assert.equal(out.fields.subtotal.message, M.SPACES, JSON.stringify(value));
      assert.equal(out.results, null, JSON.stringify(value));
    }
  });

  test('S-1.32: Urdu "۱۰۰" and Eastern Arabic "١٠٠" are read as 100', () => {
    assert.equal(receiptLines(run({ subtotal: '۱۰۰' }))[0], 'Subtotal 100.00');
    assert.equal(receiptLines(run({ subtotal: '١٠٠' }))[0], 'Subtotal 100.00');
  });

  test('S-1.33: "−5" (minus sign) and "–5" (en dash) get "Amount can\'t be negative."', () => {
    for (const value of ['−5', '–5']) {
      const out = leaving('subtotal', value);
      assert.equal(out.fields.subtotal.message, M.NEGATIVE, value);
      assert.equal(out.results, null, value);
    }
  });
});

describe('S-2: Choose a tip and see its amount', () => {
  const custom = (customTip, extra = {}) =>
    run({ subtotal: '200', tipChoice: 'custom', customTip, left: { customTip: true }, ...extra });

  test('S-2.1: 10% of 1000 with tax 160 is a tip of 100.00 and a total of 1,260.00', () => {
    const out = run({ subtotal: '1000', tax: '160', tipChoice: '10' });
    assert.equal(tipLine(out), 'Tip (10%) 100.00');
    assert.equal(totalLine(out), 'Total 1,260.00');
  });

  test('S-2.2: 20% gives a tip of 200.00 and a total of 1,360.00', () => {
    const out = run({ subtotal: '1000', tax: '160', tipChoice: '20' });
    assert.equal(tipLine(out), 'Tip (20%) 200.00');
    assert.equal(totalLine(out), 'Total 1,360.00');
  });

  test('S-2.3: 15% of 10.05 is 1.51 (1.5075 rounded), total 11.56', () => {
    const out = run({ subtotal: '10.05', tipChoice: '15' });
    assert.equal(tipLine(out), 'Tip (15%) 1.51');
    assert.equal(totalLine(out), 'Total 11.56');
  });

  test('S-2.4: a custom tip of 12.5 on 200 is 25.00, total 225.00', () => {
    const out = custom('12.5');
    assert.equal(tipLine(out), 'Tip (12.5%) 25.00');
    assert.equal(totalLine(out), 'Total 225.00');
  });

  test('S-2.5: a pasted " 15% " is read as 15', () => {
    assert.equal(tipLine(custom(' 15% ')), 'Tip (15%) 30.00');
  });

  test('S-2.6: custom tips "12.50" and "007" are labelled 12.5% and 7%', () => {
    assert.equal(tipLine(custom('12.50')), 'Tip (12.5%) 25.00');
    assert.equal(tipLine(custom('007')), 'Tip (7%) 14.00');
  });

  test('S-2.7: leaving the custom tip empty shows "Enter a tip percentage."', () => {
    const out = custom('');
    assert.equal(out.fields.customTip.message, M.TIP_EMPTY);
    assert.equal(out.results, null);
  });

  test('S-2.8: ten, -5, -0.001, 1,500, $15 and 15%% show "Tip must be a number from 0 to 100."', () => {
    for (const value of ['ten', '-5', '-0.001', '1,500', '$15', '15%%']) {
      const out = custom(value);
      assert.equal(out.fields.customTip.message, M.TIP_RANGE, value);
      assert.equal(out.results, null, value);
    }
  });

  test('S-2.9: 0% (preset or custom 0) gives a tip of 0.00 and a total of 1,160.00', () => {
    const preset = run({ subtotal: '1000', tax: '160', tipChoice: '0' });
    assert.equal(tipLine(preset), 'Tip (0%) 0.00');
    assert.equal(totalLine(preset), 'Total 1,160.00');
    const customZero = custom('0', { subtotal: '1000', tax: '160' });
    assert.equal(tipLine(customZero), 'Tip (0%) 0.00');
    assert.equal(totalLine(customZero), 'Total 1,160.00');
  });

  test('S-2.10: a custom tip of 100 on 1000 is 1,000.00', () => {
    assert.equal(tipLine(custom('100', { subtotal: '1000' })), 'Tip (100%) 1,000.00');
  });

  test('S-2.11: a custom tip of 100.01 is out of range', () => {
    assert.equal(custom('100.01').fields.customTip.message, M.TIP_RANGE);
  });

  test('S-2.12: a custom tip of 100.001 gets the decimals message (checked before the range)', () => {
    assert.equal(custom('100.001').fields.customTip.message, M.TOO_MANY_DECIMALS);
  });

  test('S-2.13: 15% of 0.10 rounds 1.5 cents up to 0.02, total 0.12', () => {
    const out = run({ subtotal: '0.10', tipChoice: '15' });
    assert.equal(tipLine(out), 'Tip (15%) 0.02');
    assert.equal(totalLine(out), 'Total 0.12');
  });

  test('S-2.14: 10% of 0.05 rounds 0.5 cents up to 0.01, total 0.06', () => {
    const out = run({ subtotal: '0.05', tipChoice: '10' });
    assert.equal(tipLine(out), 'Tip (10%) 0.01');
    assert.equal(totalLine(out), 'Total 0.06');
  });

  test('S-2.15: the largest values give a tip of 1,000,000.00 and a total of 3,000,000.00 exactly', () => {
    const out = custom('100', { subtotal: '1000000', tax: '1000000' });
    assert.equal(tipLine(out), 'Tip (100%) 1,000,000.00');
    assert.equal(totalLine(out), 'Total 3,000,000.00');
  });

  test('S-2.16: a custom tip of 0.01% on 1000000 is 100.00', () => {
    assert.equal(tipLine(custom('0.01', { subtotal: '1000000' })), 'Tip (0.01%) 100.00');
  });

  test('S-2.17: 10% of 0.01 rounds down to 0.00, total 0.01', () => {
    const out = run({ subtotal: '0.01', tipChoice: '10' });
    assert.equal(tipLine(out), 'Tip (10%) 0.00');
    assert.equal(totalLine(out), 'Total 0.01');
  });

  test('S-2.18: a custom tip of 1e15 is out of range', () => {
    assert.equal(custom('1e15').fields.customTip.message, M.TIP_RANGE);
  });

  test('S-2.19: a custom tip of 0.001 has too many decimal places', () => {
    assert.equal(custom('0.001').fields.customTip.message, M.TOO_MANY_DECIMALS);
  });

  test('S-2.20: changing the subtotal from 1000 to 2000 updates the tip to 200.00', () => {
    assert.equal(tipLine(run({ subtotal: '1000' })), 'Tip (10%) 100.00');
    assert.equal(tipLine(run({ subtotal: '2000' })), 'Tip (10%) 200.00');
  });

  test('S-2.21: after a custom tip error, selecting 15% clears the error and shows results', () => {
    const state = evenState({ subtotal: '200', tipChoice: 'custom', customTip: 'ten', left: { customTip: true } });
    assert.equal(compute(state).fields.customTip.message, M.TIP_RANGE);
    const out = compute({ ...state, tipChoice: '15' });
    assert.equal(out.fields.customTip.message, null);
    assert.equal(tipLine(out), 'Tip (15%) 30.00');
  });

  test('S-2.22: selecting Custom again keeps what was typed and shows its error again', () => {
    const state = evenState({ subtotal: '200', tipChoice: '15', customTip: 'ten', left: { customTip: true } });
    const out = compute({ ...state, tipChoice: 'custom' });
    assert.equal(state.customTip, 'ten');
    assert.equal(out.fields.customTip.message, M.TIP_RANGE);
    assert.equal(out.results, null);
  });

  // Found in QA testing (added 18 Oct 2026)

  test('S-2.23: a custom tip of "12,5" asks for a decimal point', () => {
    const out = custom('12,5');
    assert.equal(out.fields.customTip.message, M.DECIMAL_COMMA);
    assert.equal(out.results, null);
  });

  test('S-2.24: a custom tip of Urdu "۱۵" is read as 15', () => {
    assert.equal(tipLine(custom('۱۵')), 'Tip (15%) 30.00');
  });
});

describe('S-3: Split the total evenly so the shares add up exactly', () => {
  // A total of 1,260.00: subtotal 1000, tax 160, tip 10%.
  const split1260 = (people, extra = {}) =>
    run({ subtotal: '1000', tax: '160', people, ...extra }).results?.split;
  const people = (value) => run({ subtotal: '1000', people: value, left: { people: true } });

  test('S-3.1: 1,260.00 between 4 people is 315.00 each', () => {
    assert.deepEqual(split1260('4'), ['Each person pays 315.00', '4 shares add up to 1,260.00']);
  });

  test('S-3.2: 100.00 between 3 people is 33.34, 33.33, 33.33', () => {
    assert.deepEqual(run({ subtotal: '100', tipChoice: '0', people: '3' }).results.split, [
      '1 person pays 33.34',
      '2 people pay 33.33',
      '3 shares add up to 100.00',
    ]);
  });

  test('S-3.3: " 4 " and "04" are read as 4 people', () => {
    assert.equal(split1260(' 4 ')[0], 'Each person pays 315.00');
    assert.equal(split1260('04')[0], 'Each person pays 315.00');
  });

  test('S-3.4: empty, two, 3 people, -3, 2.5, 3.0 and 1,000 are not valid numbers of people', () => {
    for (const value of ['', 'two', '3 people', '-3', '2.5', '3.0', '1,000']) {
      const out = people(value);
      assert.equal(out.fields.people.message, M.PEOPLE_INVALID, JSON.stringify(value));
      assert.equal(out.results, null, JSON.stringify(value));
    }
  });

  test('S-3.5: 0 people is not allowed', () => {
    assert.equal(people('0').fields.people.message, M.PEOPLE_INVALID);
  });

  test('S-3.6: 1 person pays the whole 1,260.00', () => {
    assert.deepEqual(split1260('1'), ['Each person pays 1,260.00', '1 share adds up to 1,260.00']);
  });

  test('S-3.7: 50 people pay 25.20 each', () => {
    assert.deepEqual(split1260('50'), ['Each person pays 25.20', '50 shares add up to 1,260.00']);
  });

  test('S-3.8: 51 people is not allowed', () => {
    assert.equal(people('51').fields.people.message, M.PEOPLE_INVALID);
  });

  const total3m = (count) =>
    run({ subtotal: '1000000', tax: '1000000', tipChoice: 'custom', customTip: '100', people: count }).results.split;

  test('S-3.9: 3,000,000.00 between 7 people is six of 428,571.43 and one of 428,571.42', () => {
    assert.deepEqual(total3m('7'), [
      '6 people pay 428,571.43',
      '1 person pays 428,571.42',
      '7 shares add up to 3,000,000.00',
    ]);
  });

  test('S-3.10: 3,000,000.00 between 50 people is 60,000.00 each', () => {
    assert.equal(total3m('50')[0], 'Each person pays 60,000.00');
  });

  test('S-3.11: 0.02 between 3 people is 0.01, 0.01, 0.00', () => {
    assert.deepEqual(run({ subtotal: '0.02', tipChoice: '0', people: '3' }).results.split, [
      '2 people pay 0.01',
      '1 person pays 0.00',
      '3 shares add up to 0.02',
    ]);
  });

  test('S-3.12: 0.01 between 50 people is one of 0.01 and 49 of 0.00', () => {
    assert.deepEqual(run({ subtotal: '0.01', tipChoice: '0', people: '50' }).results.split, [
      '1 person pays 0.01',
      '49 people pay 0.00',
      '50 shares add up to 0.01',
    ]);
  });

  test('S-3.13: 1e15 and 0.001 are not valid numbers of people', () => {
    for (const value of ['1e15', '0.001']) {
      assert.equal(people(value).fields.people.message, M.PEOPLE_INVALID, value);
    }
  });

  test('S-3.14: changing 3 people to 4 shows 315.00 each', () => {
    assert.equal(split1260('3')[0], 'Each person pays 420.00'); // 1,260.00 / 3 = 420.00 exactly
    assert.equal(split1260('4')[0], 'Each person pays 315.00');
  });

  test('S-3.15: "two" hides the results and outlines the field; correcting to 2 shows 630.00 each', () => {
    const typing = run({ subtotal: '1000', tax: '160', people: 'two' });
    assert.equal(typing.results, null);
    assert.equal(typing.fields.people.invalid, true);
    assert.equal(split1260('2')[0], 'Each person pays 630.00');
  });

  test('S-3.16: Reset on Split evenly returns to the opening state described in S-1.1', () => {
    const reset = resetState(evenState({ subtotal: '1000', tax: '160', people: '7', tipChoice: '20' }));
    assert.deepEqual(reset, initialState());
  });

  // Found in QA testing (added 18 Oct 2026)

  test('S-3.17: the Urdu digit "۴" is read as 4 people', () => {
    assert.equal(split1260('۴')[0], 'Each person pays 315.00');
  });
});
