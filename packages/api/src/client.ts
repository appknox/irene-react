import axios from 'axios';
import { getConfigText } from '@irene/config';

export const PRODUCT = {
  APPKNOX: 0,
  DEVKNOX: 1,
} as const;

const DEVKNOX_HOSTNAME = 'secure.devknox.io';

/** Devknox and Appknox are one bundle on two hostnames. */
export const currentProduct = (): number =>
  window.location.hostname === DEVKNOX_HOSTNAME ? PRODUCT.DEVKNOX : PRODUCT.APPKNOX;

export const apiClient = axios.create();

/**
 * Resolve the host per request, not at import, so a deferred runtimeconfig tag
 * cannot strip it. An empty base URL means same origin.
 */
apiClient.interceptors.request.use((request) => {
  request.baseURL = getConfigText('IRENE_API_HOST');
  request.headers.set('X-Product', String(currentProduct()));

  return request;
});
