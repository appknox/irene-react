import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

import { getConfigValue } from '@irene/config';
import { ENUMS } from '@irene/enums';

const DEVKNOX_HOSTNAME = 'secure.devknox.io';

/**
 * Works out which product the app is serving from the hostname.
 *
 * @returns `ENUMS.PRODUCT.DEVKNOX` on the Devknox host, else `ENUMS.PRODUCT.APPKNOX`.
 */
export const currentProduct = (): number =>
  window.location.hostname === DEVKNOX_HOSTNAME ? ENUMS.PRODUCT.DEVKNOX : ENUMS.PRODUCT.APPKNOX;

/** The axios instance every API request goes through, with the API host and product header set. */
export const client = axios.create({
  baseURL: getConfigValue('IRENE_API_HOST'),
  headers: {
    Accept: 'application/json, text/plain, */*',
    'X-Product': String(currentProduct()),
  },
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
  return client<TData>(options).then((response: AxiosResponse<TData>) => response.data);
}

/**
 * One helper per HTTP verb, each resolving to the response body.
 *
 * @example
 * const page = await apiRequest.get<DrfPageResponse<Project>>('api/v3/projects', { params: { limit: 10 } });
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
