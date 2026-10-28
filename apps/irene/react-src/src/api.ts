import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';

/*
  How the React screens reach the API.

  Everything they need is already in the browser: the host writes its session
  to local storage and a deployment injects its configuration into a global
  before the app boots. Nothing is handed over.
*/

/** Where the host keeps its session. */
const SESSION_KEY = 'ember_simple_auth-session';

/** What a deployment injects at container start. */
interface RuntimeConfig {
  IRENE_API_HOST?: string;
}

/**
 * The API host this deployment talks to.
 *
 * @returns The injected host, or the public one where none was injected.
 */
function apiHost(): string {
  const injected = (globalThis as { runtimeGlobalConfig?: RuntimeConfig }).runtimeGlobalConfig;

  return injected?.IRENE_API_HOST || 'https://api.appknox.com';
}

/**
 * The credential the host signed in with.
 *
 * @returns The Authorization header value, or undefined when signed out.
 */
function authorization(): string | undefined {
  try {
    const stored = window.localStorage.getItem(SESSION_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    const token = parsed?.authenticated?.b64token;

    return typeof token === 'string' ? `Basic ${token}` : undefined;
  } catch {
    /* Blocked storage reads as signed out, which the API answers for. */
    return undefined;
  }
}

/** The client every screen reads through. */
export const api = axios.create({
  baseURL: apiHost(),
  headers: { Accept: 'application/json' },
});

/*
  Read per request rather than baked into the defaults: signing in and out
  changes it, and a client built at import time would carry the old one.
*/
api.interceptors.request.use((config) => {
  const credential = authorization();

  if (credential) {
    config.headers.Authorization = credential;
  }

  return config;
});

/** The cache the screens share, so two of them never ask for the same thing twice. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});
