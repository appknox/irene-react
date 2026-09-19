/**
 * Values shared across packages that are neither configuration nor server
 * enums. Everything sits in `core` until a domain grows enough to earn its own
 * file, at which point it moves and is re-exported from here.
 */
export * from './core.ts';
export * from './status-codes.ts';
