import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

import { getConfigValue } from '@irene/config';
import { DEVKNOX_HOSTNAME } from '@irene/constants';
import { ENUMS } from '@irene/enums';
import { getAuthorizationHeader } from '@irene/api/utils/session';

/**
 * Works out which product the app is serving from the hostname.
 *
 * @returns `ENUMS.PRODUCT.DEVKNOX` on the Devknox host, else `ENUMS.PRODUCT.APPKNOX`.
 */
export const currentProduct = () =>
  window.location.hostname === DEVKNOX_HOSTNAME ? ENUMS.PRODUCT.DEVKNOX : ENUMS.PRODUCT.APPKNOX;

/** The axios instance every API request goes through, with the API host and product header set. */
export const client = axios.create({
  baseURL: getConfigValue('IRENE_API_HOST'),
  headers: {
    Accept: 'application/json, text/plain, */*',
    'X-Product': String(currentProduct()),
  },
});

/*
  Attaches the stored credential to every request, so no call site has to
  remember to. Read per request rather than baked into the client's defaults:
  signing in and out changes it, and a client built at import time would still
  be carrying the credential from before.
*/
client.interceptors.request.use((config) => {
  const authorization = getAuthorizationHeader();

  // An explicit header wins, for a credential that is not the stored one yet.
  if (authorization && !config.headers.Authorization) {
    config.headers.Authorization = authorization;
  }

  return config;
});

/** What a verb helper accepts: everything but what the helper itself sets. */
type RequestOptions = Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>;

/**
 * Sends a request through the shared client.
 *
 * @param options - The axios request config.
 * @returns The response body; rejects with the `AxiosError` on failure.
 */
export async function request<TData>(options: AxiosRequestConfig): Promise<TData> {
  const response: AxiosResponse<TData> = await client<TData>(options);

  return response.data;
}

/**
 * One helper per HTTP verb, each resolving to the response body.
 *
 * @example
 * const page = await apiRequest.get<ApiPageResponse<ApiProject>>('api/v3/projects', { params: { limit: 10 } });
 */
export const apiRequest = {
  get: <TData>(url: string, options?: RequestOptions) =>
    request<TData>({ ...options, url, method: 'GET' }),

  post: <TData>(url: string, data?: unknown, options?: RequestOptions) =>
    request<TData>({ ...options, url, method: 'POST', data }),

  put: <TData>(url: string, data?: unknown, options?: RequestOptions) =>
    request<TData>({ ...options, url, method: 'PUT', data }),

  patch: <TData>(url: string, data?: unknown, options?: RequestOptions) =>
    request<TData>({ ...options, url, method: 'PATCH', data }),

  delete: <TData>(url: string, options?: RequestOptions) =>
    request<TData>({ ...options, url, method: 'DELETE' }),
};
