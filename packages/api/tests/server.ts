import { setupServer } from 'msw/node';
import { getConfigValue } from '@irene/config';

/**
 * Intercepts at the network boundary, so tests exercise the real axios stack —
 * interceptors, serialisation and status handling included.
 */
export const server = setupServer();

/**
 * The host the client resolves to, rather than a copy of the fallback. Read on
 * call: this module loads from the setup file, before the config tiers exist.
 */
export const apiHost = () => getConfigValue('IRENE_API_HOST');

/** Builds the URL a handler intercepts, from the host and a path. */
export const buildAPITestURL = (path: string) => `${apiHost()}/${path}`;
