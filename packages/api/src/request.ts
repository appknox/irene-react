import axios, { isAxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';

import { getConfigValue } from '@irene/config';
import { DEVKNOX_HOSTNAME, HTTP_STATUS_CODES } from '@irene/constants';
import { ENUMS } from '@irene/enums';

import { AuthEndpoints } from '@irene/api/services/auth/endpoints';
import { isRateLimitExempt, rateLimitStore } from '@irene/api/stores/rate-limit';
import { getApiErrorMessage } from '@irene/api/utils/errors';
import { clearStoredSession, getAuthorizationHeader } from '@irene/api/utils/session';

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

/** What a verb helper accepts: everything but what the helper itself sets. */
type RequestOptions = Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>;

/**
 * ============================================================
 * CONSTANTS
 * ============================================================
 */
/**
 * Works out which product the app is serving from the hostname.
 *
 * @returns `ENUMS.PRODUCT.DEVKNOX` on the Devknox host, else `ENUMS.PRODUCT.APPKNOX`.
 */
export const currentProduct = () =>
  window.location.hostname === DEVKNOX_HOSTNAME ? ENUMS.PRODUCT.DEVKNOX : ENUMS.PRODUCT.APPKNOX;

/*
  The endpoints that answer 401 as part of their own job: a wrong password, a
  refused SSO token, a spent reset link. Each is reported where the user is
  standing, so none of them should throw the user out of the app.
*/
export const SELF_HANDLING_UNAUTHORIZED_API_ENDPOINTS = [
  AuthEndpoints.check(),
  AuthEndpoints.login(),
  AuthEndpoints.logout(),
  AuthEndpoints.recover(),
  AuthEndpoints.ssoCheck(),
  AuthEndpoints.samlStart(),
  AuthEndpoints.samlLogin(),
  AuthEndpoints.oidcStart(),
  AuthEndpoints.oidcCallback(),
];

/**
 * ============================================================
 * REQUEST CLIENT
 * ============================================================
 */

/** The axios instance every API request goes through, with the API host and product header set. */
export const client = axios.create({
  baseURL: getConfigValue('IRENE_API_HOST'),
  headers: { Accept: 'application/json, text/plain, */*', 'X-Product': String(currentProduct()) },
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

/*
  A 401 means the credential is gone, so the session ends and the user returns
  to login — except on the endpoints in `SELF_HANDLED_PATHS`. A 429 means the account is throttled,
  which becomes a countdown the whole app can read.

  The error is re-thrown either way, so callers still see what happened.
*/
client.interceptors.response.use(undefined, (error: unknown) => {
  if (!isAxiosError(error) || !error.response) {
    return Promise.reject(error);
  }

  const { response, config } = error;
  const url = config?.url ?? '';
  const resStatus = response.status;
  const resData = response.data;

  // The server is throttling this account, so start the wait everyone reads from.
  if (resStatus === HTTP_STATUS_CODES.TOO_MANY_REQUESTS && !isRateLimitExempt(url)) {
    rateLimitStore.getState().throttle(resData);
  }

  // If the endpoint is not in `SELF_HANDLED_PATHS`,
  // it means the credential is gone, so the session ends and the user returns to login.
  const handlesItsOwn = SELF_HANDLING_UNAUTHORIZED_API_ENDPOINTS.some((path) => url.includes(path));

  if (resStatus === HTTP_STATUS_CODES.UNAUTHORIZED && !handlesItsOwn) {
    const refusal = getApiErrorMessage(error)?.toLowerCase() ?? '';
    const reason = refusal.includes('inactive') ? 'userInactive' : 'sessionExpired';

    clearStoredSession();
    window.location.replace(`/login?${reason}=true`);
  }

  return Promise.reject(error);
});

/**
 * ============================================================
 * REQUEST HELPERS
 * ============================================================
 */

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
