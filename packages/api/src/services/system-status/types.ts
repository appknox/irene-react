/**
 * Where to send the request that proves the object store is reachable.
 *
 * @interface ApiStorageProbe
 * @property {object} data - The envelope the endpoint answers with.
 * @property {string} data.storage - A pre-signed URL for an object that does not exist.
 */
export interface ApiStorageProbe {
  data: { storage: string };
}

/**
 * What a reachable service answers a ping with.
 *
 * @interface ApiPingResponse
 * @property {string} ping - `pong` while the service is up.
 */
export interface ApiPingResponse {
  ping: string;
}
