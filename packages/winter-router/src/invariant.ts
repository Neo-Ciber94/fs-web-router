class InvariantError extends Error {}

export function invariant(value: unknown, message: string): asserts value {
  if (!value) {
    throw new InvariantError(`Invariant failed: ${message}`);
  }
}
