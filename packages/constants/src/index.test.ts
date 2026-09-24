import { describe, expect, it } from 'vitest';

import { APPKNOX_SUPPORT_EMAIL, DEVKNOX_HOSTNAME } from './core.ts';
import * as constants from './index.ts';
import { HTTP_STATUS_CODES } from './status-codes.ts';

describe('constants', () => {
  it('carries the Appknox hosts and support addresses', () => {
    expect(DEVKNOX_HOSTNAME).toBe('secure.devknox.io');
    expect(APPKNOX_SUPPORT_EMAIL).toBe('support@appknox.com');
  });

  it('re-exports every domain constant from the barrel', () => {
    expect(constants.DEVKNOX_HOSTNAME).toBe(DEVKNOX_HOSTNAME);
    expect(constants.APPKNOX_SUPPORT_EMAIL).toBe(APPKNOX_SUPPORT_EMAIL);
  });
});

describe('http status codes', () => {
  it('carries the 2xx statuses', () => {
    expect(HTTP_STATUS_CODES.OK).toBe(200);
    expect(HTTP_STATUS_CODES.CREATED).toBe(201);
    expect(HTTP_STATUS_CODES.ACCEPTED).toBe(202);
    expect(HTTP_STATUS_CODES.NO_CONTENT).toBe(204);
    expect(HTTP_STATUS_CODES.FOUND).toBe(302);
    expect(HTTP_STATUS_CODES.NOT_MODIFIED).toBe(304);
  });

  it('carries the error statuses the app branches on', () => {
    expect(HTTP_STATUS_CODES.BAD_REQUEST).toBe(400);
    expect(HTTP_STATUS_CODES.UNAUTHORIZED).toBe(401);
    expect(HTTP_STATUS_CODES.FORBIDDEN).toBe(403);
    expect(HTTP_STATUS_CODES.NOT_FOUND).toBe(404);
    expect(HTTP_STATUS_CODES.NOT_ACCEPTABLE).toBe(406);
    expect(HTTP_STATUS_CODES.GONE).toBe(410);
    expect(HTTP_STATUS_CODES.TOO_MANY_REQUESTS).toBe(429);
    expect(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).toBe(500);
    expect(HTTP_STATUS_CODES.BAD_GATEWAY).toBe(502);
    expect(HTTP_STATUS_CODES.SERVICE_UNAVAILABLE).toBe(503);
    expect(HTTP_STATUS_CODES.GATEWAY_TIMEOUT).toBe(504);
  });

  it('re-exports the status codes from the barrel', () => {
    expect(constants.HTTP_STATUS_CODES).toBe(HTTP_STATUS_CODES);
  });
});
