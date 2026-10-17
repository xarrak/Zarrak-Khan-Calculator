// The arithmetic. Every argument and result is a BigInt count of cents
// (or hundredths of a percent for the tip). No floating-point numbers (D-19).

/**
 * Tip on the subtotal, rounded to the nearest cent with exact halves rounded
 * up (D-3). All values are zero or positive, so adding half the divisor before
 * BigInt's truncating division rounds half up.
 * @param {bigint} subtotalCents
 * @param {bigint} tipHundredths tip percentage in hundredths of a percent (1250n = 12.5%)
 */
export function tipCents(subtotalCents, tipHundredths) {
  return (subtotalCents * tipHundredths + 5_000n) / 10_000n;
}

/**
 * Split a total evenly between `count` people (D-4).
 * `higherCount` people pay `base + 1` cent and the rest pay `base`, so the
 * shares always add up exactly to the total.
 * @returns {{ base: bigint, higherCount: bigint, lowerCount: bigint }}
 */
export function evenSplit(totalCents, count) {
  const base = totalCents / count;
  const higherCount = totalCents % count;
  return { base, higherCount, lowerCount: count - higherCount };
}

/**
 * Share `extraCents` (tax and service charges plus tip) between people in
 * proportion to what each ordered (D-5).
 *
 * Each share is rounded down to the cent. The cents left over go one at a time
 * to the people with the largest remainders; ties go to the person higher in
 * the list. The products extra × ordered can exceed 2^53, which is why this
 * must be BigInt: with ordinary numbers the remainders come out slightly
 * wrong and a leftover cent can go to the wrong person (criterion S-6.10).
 *
 * @param {bigint[]} orderedCents each person's ordered amount, every one at least 1n
 * @param {bigint} extraCents
 * @returns {bigint[]} each person's share of the extra, in list order
 */
export function allocateExtra(orderedCents, extraCents) {
  const sum = orderedCents.reduce((a, b) => a + b, 0n);
  const shares = orderedCents.map((o) => (extraCents * o) / sum);
  const remainders = orderedCents.map((o) => (extraCents * o) % sum);

  let leftover = extraCents - shares.reduce((a, b) => a + b, 0n);
  const order = orderedCents
    .map((_, index) => index)
    .sort((a, b) => {
      if (remainders[a] !== remainders[b]) return remainders[a] > remainders[b] ? -1 : 1;
      return a - b; // tie: higher in the list first
    });
  for (const index of order) {
    if (leftover === 0n) break;
    shares[index] += 1n;
    leftover -= 1n;
  }
  return shares;
}
