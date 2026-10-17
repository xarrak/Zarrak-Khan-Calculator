// Money is a BigInt count of cents everywhere in src/lib (D-6, D-19).
// Text is turned into cents by joining digit strings, never through
// floating-point numbers, so "0.1" + "0.2" is exactly 30n cents.

// Digits with an optional single decimal point, and at least one digit.
// Examples that match: "1250", "1250.5", ".5", "12.", "007".
const DECIMAL_TEXT = /^(\d*)(?:\.(\d*))?$/;

/**
 * Split decimal text into its whole and fraction digit strings.
 * Returns null when the text is not digits with an optional single decimal point.
 * @param {string} text already trimmed
 * @returns {{whole: string, fraction: string} | null}
 */
export function splitDecimal(text) {
  const match = DECIMAL_TEXT.exec(text);
  if (!match) return null;
  const whole = match[1];
  const fraction = match[2] ?? '';
  if (whole === '' && fraction === '') return null; // "." or "" has no digits
  return { whole, fraction };
}

/**
 * Convert whole and fraction digit strings (fraction at most 2 digits)
 * into a BigInt count of hundredths. Used for cents and for tip percentages
 * in hundredths of a percent.
 * @returns {bigint}
 */
export function toHundredths({ whole, fraction }) {
  const wholePart = BigInt(whole === '' ? '0' : whole);
  const fractionPart = BigInt((fraction + '00').slice(0, 2));
  return wholePart * 100n + fractionPart;
}

/** Insert a comma every three digits in a string of digits. */
function groupThousands(digits) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format BigInt cents as "1,260.00". Grouping is done by hand rather than
 * with the browser's locale formatting, so the output never depends on the
 * browser's language.
 * @param {bigint} cents
 * @returns {string}
 */
export function formatCents(cents) {
  const negative = cents < 0n;
  const abs = negative ? -cents : cents;
  const whole = (abs / 100n).toString();
  const fraction = (abs % 100n).toString().padStart(2, '0');
  return `${negative ? '-' : ''}${groupThousands(whole)}.${fraction}`;
}

/**
 * Format a tip percentage held in hundredths of a percent, without trailing
 * decimal zeros: 1250n → "12.5", 700n → "7", 10n → "0.1", 1n → "0.01".
 * @param {bigint} hundredths
 * @returns {string}
 */
export function formatPercent(hundredths) {
  const whole = (hundredths / 100n).toString();
  const fraction = (hundredths % 100n).toString().padStart(2, '0').replace(/0+$/, '');
  return fraction === '' ? whole : `${whole}.${fraction}`;
}
