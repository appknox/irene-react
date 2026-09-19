/**
 * The cache keys for everything auth. Hierarchical, so invalidating `all()`
 * clears every auth query in one call rather than naming each one.
 */
export const authKeys = {
  all: () => ['authentication'] as const,
  session: () => [...authKeys.all(), 'session'] as const,
  resetToken: (token: string) => [...authKeys.all(), 'reset-token', token] as const,
};
