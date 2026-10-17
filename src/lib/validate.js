// Parsing and validation for every kind of input, with the message
// precedence orders from the shared definitions in docs/user-stories.md.
// Every function returns { ok: true, value } or { ok: false, message },
// or { ok: true, empty: true } for an optional field left empty.

import { splitDecimal, toHundredths } from './money.js';
import * as M from './messages.js';

const MAX_CENTS = 100_000_000n; // 1,000,000.00

// A comma or currency symbol anywhere, or a currency code at the start or end,
// in any letter case, with or without a space (shared definitions: "Money inputs").
const CURRENCY_SYMBOL_OR_COMMA = /[,$€£₹₨]/;
const CURRENCY_CODE_AT_START = /^(rs\.?|pkr)/i;
const CURRENCY_CODE_AT_END = /(rs\.?|pkr)$/i;

// A comma used as a decimal point, such as "12,50" or ",5" (D-30). A comma
// followed by three digits, as in "1,250", is a thousands separator instead.
const DECIMAL_COMMA = /^\d*,\d{1,2}$/;
// Digits separated by a space, including a no-break space from pasted text (D-31).
const SPACE_BETWEEN_DIGITS = /\d\s+\d/;
// A minus sign, including the minus, en dash and em dash characters that
// documents and phones insert in place of a hyphen (D-33).
const NEGATIVE_SIGN = /^[-−–—]/;
// Eastern Arabic digits (٠ to ٩) and the Urdu and Persian forms (۰ to ۹) (D-32).
const EASTERN_DIGITS = /[٠-٩۰-۹]/g;

/**
 * Read Eastern Arabic and Urdu digits as 0 to 9. Both ranges start at a code
 * point ending in 0, so the digit's value is the last hex digit of its code.
 */
export function normalizeDigits(text) {
  return text.replace(EASTERN_DIGITS, (digit) => String(digit.charCodeAt(0) & 0xf));
}

function hasCommaOrCurrency(text) {
  return (
    CURRENCY_SYMBOL_OR_COMMA.test(text) ||
    CURRENCY_CODE_AT_START.test(text) ||
    CURRENCY_CODE_AT_END.test(text)
  );
}

/**
 * Validate a money input.
 * @param {string} raw the text exactly as typed
 * @param {'subtotal'|'tax'|'ordered'} kind which field, which sets the empty
 *   and minimum rules
 */
export function parseMoney(raw, kind) {
  const text = normalizeDigits(raw.trim());

  // 1. empty
  if (text === '') {
    if (kind === 'tax') return { ok: true, value: 0n, empty: true };
    return { ok: false, message: kind === 'subtotal' ? M.SUBTOTAL_EMPTY : M.ORDERED_MIN, empty: true };
  }
  // 2. a comma used as a decimal point
  if (DECIMAL_COMMA.test(text)) return { ok: false, message: M.DECIMAL_COMMA };
  // 3. comma or currency symbol
  if (hasCommaOrCurrency(text)) return { ok: false, message: M.COMMA_OR_CURRENCY };
  // 4. spaces between digits
  if (SPACE_BETWEEN_DIGITS.test(text)) return { ok: false, message: M.SPACES };
  // 5. negative
  if (NEGATIVE_SIGN.test(text)) return { ok: false, message: M.NEGATIVE };
  // 6. not a valid number
  const parts = splitDecimal(text);
  if (!parts) return { ok: false, message: M.NOT_A_NUMBER };
  // 7. more than 2 decimal places
  if (parts.fraction.length > 2) return { ok: false, message: M.TOO_MANY_DECIMALS };

  const cents = toHundredths(parts);
  // 8. below the minimum
  if (kind === 'subtotal' && cents < 1n) return { ok: false, message: M.SUBTOTAL_MIN };
  if (kind === 'ordered' && cents < 1n) return { ok: false, message: M.ORDERED_MIN };
  // 9. above the maximum
  if (cents > MAX_CENTS) return { ok: false, message: M.AMOUNT_MAX };

  return { ok: true, value: cents };
}

/**
 * Validate a custom tip. Returns the tip in hundredths of a percent (BigInt).
 * Precedence: empty → a comma used as a decimal point → not a number →
 * more than 2 decimals → above 100.
 */
export function parseTip(raw) {
  let text = normalizeDigits(raw.trim());
  // 1. empty
  if (text === '') return { ok: false, message: M.TIP_EMPTY, empty: true };
  // A single trailing % is ignored, as are spaces around the value.
  if (text.endsWith('%')) text = text.slice(0, -1).trim();
  // 2. a comma used as a decimal point
  if (DECIMAL_COMMA.test(text)) return { ok: false, message: M.DECIMAL_COMMA };
  // 3. not a number: anything other than digits with an optional single decimal point
  const parts = splitDecimal(text);
  if (!parts) return { ok: false, message: M.TIP_RANGE };
  // 4. more than 2 decimal places
  if (parts.fraction.length > 2) return { ok: false, message: M.TOO_MANY_DECIMALS };
  // 5. above 100
  const hundredths = toHundredths(parts);
  if (hundredths > 10_000n) return { ok: false, message: M.TIP_RANGE };
  return { ok: true, value: hundredths };
}

/**
 * Validate the number of people: digits only, from 1 to 50. Leading zeros are
 * allowed. Returns a BigInt count.
 */
export function parsePeople(raw) {
  const text = normalizeDigits(raw.trim());
  if (!/^\d+$/.test(text)) return { ok: false, message: M.PEOPLE_INVALID, empty: text === '' };
  const count = BigInt(text);
  if (count < 1n || count > 50n) return { ok: false, message: M.PEOPLE_INVALID };
  return { ok: true, value: count };
}

/**
 * The label for a person's row: the trimmed name, or "Person N" (N = position,
 * starting at 1) when the name is empty or only spaces.
 */
export function personLabel(rawName, position) {
  const name = (rawName ?? '').trim();
  return name === '' ? M.defaultPersonLabel(position) : name;
}
