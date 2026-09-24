/**
 * What a reachable device farm answers a ping with.
 *
 * @interface ApiDeviceFarmPing
 * @property {string} ping - `pong` while it is up.
 */
export interface ApiDeviceFarmPing {
  ping: string;
}
