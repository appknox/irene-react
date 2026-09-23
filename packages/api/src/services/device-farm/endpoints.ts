/**
 * Paths the device farm serves, all under its own prefix rather than at the
 * host root, since it may be served from behind the API.
 */
export const DeviceFarmEndpoints = {
  /** Answers `{ ping: 'pong' }` while the device farm is up. */
  ping: () => '/devicefarm/ping' as const,
};
