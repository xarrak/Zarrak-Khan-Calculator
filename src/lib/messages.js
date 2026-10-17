// Every fixed message and label the app shows, copied exactly from
// docs/user-stories.md. tests/messages.test.js checks each one against that
// document, so a reworded message fails the tests (D-25).

// Input errors (shared definitions: "Error messages")
export const SUBTOTAL_EMPTY = 'Enter the bill subtotal.';
export const DECIMAL_COMMA = 'Use a point for decimals, e.g. 12.50.';
export const COMMA_OR_CURRENCY = 'Remove commas and currency symbols, e.g. 1250.50.';
export const SPACES = 'Remove the spaces, e.g. 1250.50.';
export const NEGATIVE = "Amount can't be negative.";
export const NOT_A_NUMBER = 'Enter an amount using digits and an optional decimal point, e.g. 1250.50.';
export const TOO_MANY_DECIMALS = 'Use at most 2 decimal places.';
export const SUBTOTAL_MIN = 'Subtotal must be at least 0.01.';
export const AMOUNT_MAX = "Amount can't be more than 1,000,000.00.";
export const TIP_EMPTY = 'Enter a tip percentage.';
export const TIP_RANGE = 'Tip must be a number from 0 to 100.';
export const PEOPLE_INVALID = 'Number of people must be a whole number from 1 to 50.';
export const ORDERED_MIN = 'Enter what this person ordered (at least 0.01).';

// Other fixed messages (shared definitions: "Other fixed messages")
export const FIX_FIELDS = 'Fix the highlighted fields to see the split.';
export const FILL_IN = 'Fill in the fields above to see the split.';
export const MAX_PEOPLE_NOTE = 'Up to 50 people.';
export const MATCHES_RECEIPT = 'Matches the receipt total.';

// Templates. A = amounts entered, S = receipt subtotal,
// T = receipt total, D = difference. All arguments are formatted strings.
export const warningBelow = (A, S, D) =>
  `The amounts entered add up to ${A}, but the receipt subtotal is ${S}. ${D} is not assigned to anyone.`;
export const warningAbove = (A, D, S) =>
  `The amounts entered add up to ${A}, which is ${D} more than the receipt subtotal of ${S}. Check for an item entered twice.`;
export const totalBelow = (D, T) => `${D} less than the receipt total of ${T}.`;
export const totalAbove = (D, T) => `${D} more than the receipt total of ${T}.`;

// Results-area labels (shared definitions: "Results area")
export const LABEL_SUBTOTAL = 'Subtotal';
export const LABEL_TAX = 'Tax and service charges';
export const labelTip = (percentText) => `Tip (${percentText}%)`;
export const LABEL_TOTAL = 'Total';

// Even-split lines (S-3 display rule)
export const eachPays = (X) => `Each person pays ${X}`;
export const groupPays = (count, X) => (count === 1n ? `1 person pays ${X}` : `${count} people pay ${X}`);
export const sharesAddUp = (count, T) =>
  count === 1n ? `1 share adds up to ${T}` : `${count} shares add up to ${T}`;

// Default label for an unnamed row (shared definitions: "Names")
export const defaultPersonLabel = (position) => `Person ${position}`;
