/** Fisher–Yates shuffle. Returns a new array; the input is left untouched. */
export function shuffleItems<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Shuffles `items`, but guarantees the first item is not one matched by
 * `avoidFirst`. Used when a shuffled playlist loops: without this, the last
 * song of the previous pass can become the first song of the next one and play
 * twice in a row.
 */
export function shuffleAvoidingFirst<T>(
  items: readonly T[],
  avoidFirst: (item: T) => boolean,
): T[] {
  const result = shuffleItems(items);
  if (result.length > 1 && avoidFirst(result[0])) {
    // Swap the offending first item with a random later one.
    const swapWith = 1 + Math.floor(Math.random() * (result.length - 1));
    [result[0], result[swapWith]] = [result[swapWith], result[0]];
  }
  return result;
}
