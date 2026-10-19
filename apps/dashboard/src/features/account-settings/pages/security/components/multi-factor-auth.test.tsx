import { faker } from '@faker-js/faker';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { MfaEndpoints } from '@irene/api/services/mfa';
import { UserEndpoints, type ApiUser } from '@irene/api/services/user';
import { configurationStore } from '@irene/api/stores/configuration';
import { storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import {
  buildMfaSetupToken,
  buildServerConfiguration,
  buildSession,
  buildUser,
  buildUserResponse,
} from '@tests/factories';

import { mockMfaMethods } from '@tests/mfa';
import { mockOrganizationMe } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const SECURITY_SETTINGS = '/dashboard/settings/security';

const MFA_URL = buildAPITestURL(MfaEndpoints.mfa());

const APP = 1;
const EMAIL = 2;

const session = buildSession();

const otp = () => faker.string.numeric(6);

/** The refusal the server answers a step with when it wants a code, or the code is wrong. */
const otpRefusal = () =>
  HttpResponse.json({ otp: ['OTP is required'] }, { status: HTTP_STATUS_CODES.BAD_REQUEST });

const noContent = () => new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });

const mockSignedInUser = (overrides: Partial<ApiUser> = {}) => {
  const user = buildUser(overrides);

  server.use(
    http.get(`*/${UserEndpoints.detail(session.userId)}`, () =>
      HttpResponse.json(buildUserResponse(user))
    )
  );

  return user;
};

/**
 * Answers each POST to the MFA endpoint with the next response in line, and
 * records what each one sent.
 */
const answerPosts = (...responses: (() => Response)[]) => {
  const bodies: unknown[] = [];

  server.use(
    http.post(MFA_URL, async ({ request }) => {
      bodies.push(await request.json());

      return (responses[bodies.length - 1] ?? noContent)();
    })
  );

  return bodies;
};

/** The same, for DELETE. */
const answerDeletes = (...responses: (() => Response)[]) => {
  const bodies: unknown[] = [];

  server.use(
    http.delete(MFA_URL, async ({ request }) => {
      bodies.push(await request.json());

      return (responses[bodies.length - 1] ?? noContent)();
    })
  );

  return bodies;
};

const methodRow = async (method: number) => {
  await screen.findByText(akMT('mfaMethodApp'));

  const row = document.querySelector<HTMLElement>(`[data-test-mfa-method="${method}"]`);

  if (!row) {
    throw new Error(`No row for method ${method}`);
  }

  return row;
};

const pressInRow = async (method: number, name: string) =>
  userEvent.click(within(await methodRow(method)).getByRole('button', { name }));

const dialog = () => screen.findByRole('dialog');

const pressInDialog = async (name: string) =>
  userEvent.click(within(await dialog()).getByRole('button', { name }));

const typeCode = async (code: string) =>
  userEvent.type(within(await dialog()).getByRole('textbox'), code);

describe('MultiFactorAuth', () => {
  beforeEach(() => {
    storeSession(session);
    configurationStore.getState().setServerConfiguration(buildServerConfiguration());
    mockMfaMethods();
  });

  describe('the list of methods', () => {
    it('offers both methods to an account with neither on', async () => {
      mockSignedInUser();

      await renderAtRoute(SECURITY_SETTINGS);

      expect(
        within(await methodRow(APP)).getByRole('button', { name: akMT('enable') })
      ).toBeInTheDocument();

      expect(
        within(await methodRow(EMAIL)).getByRole('button', { name: akMT('enable') })
      ).toBeInTheDocument();
    });

    it('marks the active method and offers to turn it off', async () => {
      mockSignedInUser();
      mockMfaMethods(EMAIL);

      await renderAtRoute(SECURITY_SETTINGS);

      const emailRow = await methodRow(EMAIL);

      await waitFor(() =>
        expect(within(emailRow).getByRole('button', { name: akMT('disable') })).toBeInTheDocument()
      );

      expect(emailRow.querySelector('[data-test-mfa-method-enabled]')).toBeInTheDocument();
    });

    it('withholds the disable control, and says why, where the organization mandates MFA', async () => {
      mockSignedInUser({ can_disable_mfa: false });
      mockMfaMethods(APP);

      await renderAtRoute(SECURITY_SETTINGS);

      expect(await screen.findByText(akMT('disableMFADenied'))).toBeInTheDocument();

      expect(
        within(await methodRow(APP)).queryByRole('button', { name: akMT('disable') })
      ).not.toBeInTheDocument();

      expect(
        screen.queryByRole('link', { name: akMT('organizationSettings') })
      ).not.toBeInTheDocument();
    });

    it('points an owner at the organization setting that mandates MFA', async () => {
      mockSignedInUser({ can_disable_mfa: false });
      mockOrganizationMe({ is_owner: true });

      await renderAtRoute(SECURITY_SETTINGS);

      expect(
        await screen.findByRole('link', { name: akMT('organizationSettings') })
      ).toHaveAttribute('href', '/dashboard/organization/settings');
    });
  });

  describe('turning email MFA on', () => {
    it('sends a code, then turns the method on once the code is confirmed', async () => {
      const user = mockSignedInUser();
      const setup = buildMfaSetupToken();
      const code = otp();

      const bodies = answerPosts(
        () => HttpResponse.json(setup),
        () => {
          mockMfaMethods(EMAIL);

          return noContent();
        }
      );

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(EMAIL, akMT('enable'));
      await pressInDialog(akMT('continue'));

      expect(
        await screen.findByText(akMT('mfaOtpSentTo', { email: user.email ?? '' }))
      ).toBeInTheDocument();

      await typeCode(code);
      await pressInDialog(akMT('confirm'));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

      expect(bodies).toEqual([{ method: EMAIL }, { method: EMAIL, otp: code, token: setup.token }]);

      expect(
        await within(await methodRow(EMAIL)).findByRole('button', { name: akMT('disable') })
      ).toBeInTheDocument();
    });

    it('names the address the code goes to, in bold, before sending it', async () => {
      const user = mockSignedInUser();

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(EMAIL, akMT('enable'));

      const confirmation = (await dialog()).querySelector(
        '[data-test-mfa-email-enable-send-confirm]'
      );

      expect(confirmation?.querySelector('strong')).toHaveTextContent(user.email ?? '');
    });

    it('names the address the code was sent to, in bold, once it is sent', async () => {
      const user = mockSignedInUser();

      answerPosts(() => HttpResponse.json(buildMfaSetupToken()));

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(EMAIL, akMT('enable'));
      await pressInDialog(akMT('continue'));

      const sent = await waitFor(() => {
        const box = document.querySelector('[data-test-mfa-email-sent]');

        expect(box).toBeInTheDocument();

        return box;
      });

      expect(sent?.querySelector('strong')).toHaveTextContent(user.email ?? '');
    });

    it('says so when the code cannot be sent', async () => {
      mockSignedInUser();
      answerPosts(() => HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR }));

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(EMAIL, akMT('enable'));
      await pressInDialog(akMT('continue'));

      expect(await screen.findByText(akMT('mfaOtpSendFailed'))).toBeInTheDocument();
    });

    it('asks for the code rather than sending an empty one', async () => {
      mockSignedInUser();
      const bodies = answerPosts(() => HttpResponse.json(buildMfaSetupToken()));

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(EMAIL, akMT('enable'));
      await pressInDialog(akMT('continue'));
      await pressInDialog(akMT('confirm'));

      expect(await screen.findByText(akMT('enterOTP'))).toBeInTheDocument();
      expect(bodies).toHaveLength(1);
    });

    it('says the code is wrong when the server refuses it', async () => {
      mockSignedInUser();
      answerPosts(() => HttpResponse.json(buildMfaSetupToken()), otpRefusal);

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(EMAIL, akMT('enable'));
      await pressInDialog(akMT('continue'));
      await typeCode(otp());
      await pressInDialog(akMT('confirm'));

      expect(await screen.findByText(akMT('invalidOTP'))).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('closes from its header without a request', async () => {
      mockSignedInUser();
      const bodies = answerPosts();

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(EMAIL, akMT('enable'));
      await pressInDialog(akMT('close'));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(bodies).toHaveLength(0);
    });

    it('closes without a request when cancelled', async () => {
      mockSignedInUser();
      const bodies = answerPosts();

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(EMAIL, akMT('enable'));
      await pressInDialog(akMT('cancel'));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(bodies).toHaveLength(0);
    });
  });

  describe('turning app MFA on', () => {
    it('shows the code to scan, then turns the method on with the first code the app shows', async () => {
      mockSignedInUser();
      const setup = buildMfaSetupToken();
      const code = otp();

      const bodies = answerPosts(
        () => HttpResponse.json(setup),
        () => {
          mockMfaMethods(APP);

          return noContent();
        }
      );

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(APP, akMT('enable'));

      expect(
        await screen.findByRole('img', { name: akMT('modalCard.enableMFAApp.scanBarcode') })
      ).toBeInTheDocument();

      await typeCode(code);
      await pressInDialog(akMT('continue'));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(bodies).toEqual([{ method: APP }, { method: APP, otp: code, token: setup.token }]);
    });

    it('closes and says so when no secret can be had', async () => {
      mockSignedInUser();
      answerPosts(() => HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR }));

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(APP, akMT('enable'));

      expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  });

  describe('switching from email to the app', () => {
    it('takes the emailed code, then the app’s first code', async () => {
      mockSignedInUser();
      mockMfaMethods(EMAIL);
      const setup = buildMfaSetupToken();
      const emailCode = otp();
      const appCode = otp();

      const bodies = answerPosts(
        otpRefusal,
        () => HttpResponse.json(setup),
        () => {
          mockMfaMethods(APP);

          return noContent();
        }
      );

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(APP, akMT('enable'));

      expect(await dialog()).toHaveTextContent(akMT('mfaSwitchToAppTitle'));

      await pressInDialog(akMT('continue'));
      await typeCode(emailCode);
      await pressInDialog(akMT('confirm'));

      expect(
        await screen.findByRole('img', { name: akMT('modalCard.enableMFAApp.scanBarcode') })
      ).toBeInTheDocument();

      await typeCode(appCode);
      await pressInDialog(akMT('continue'));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

      expect(bodies).toEqual([
        { method: APP },
        { method: APP, otp: emailCode },
        { method: APP, otp: appCode, token: setup.token },
      ]);
    });

    it('says something went wrong when the first step is refused for another reason', async () => {
      mockSignedInUser();
      mockMfaMethods(EMAIL);
      answerPosts(() => HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR }));

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(APP, akMT('enable'));
      await pressInDialog(akMT('continue'));

      expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
    });
  });

  describe('switching from the app to email', () => {
    it('takes the app’s code, then the emailed code', async () => {
      mockSignedInUser();
      mockMfaMethods(APP);
      const setup = buildMfaSetupToken();
      const appCode = otp();
      const emailCode = otp();

      const bodies = answerPosts(
        () => HttpResponse.json(setup),
        () => {
          mockMfaMethods(EMAIL);

          return noContent();
        }
      );

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(EMAIL, akMT('enable'));

      expect(await dialog()).toHaveTextContent(akMT('mfaSwitchToEmailTitle'));

      await pressInDialog(akMT('continue'));
      await typeCode(appCode);
      await pressInDialog(akMT('confirm'));

      expect(
        await within(await dialog()).findByLabelText(akMT('modalCard.enableMFAEmail.enterCode'))
      ).toBeInTheDocument();

      await typeCode(emailCode);
      await pressInDialog(akMT('confirm'));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

      expect(bodies).toEqual([
        { method: EMAIL, otp: appCode },
        { method: EMAIL, otp: emailCode, token: setup.token },
      ]);
    });
  });

  describe('turning MFA off', () => {
    it('says where the code will go for email MFA, then turns it off with the code sent there', async () => {
      const user = mockSignedInUser();
      mockMfaMethods(EMAIL);
      const code = otp();

      const bodies = answerDeletes(otpRefusal, () => {
        mockMfaMethods();

        return noContent();
      });

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(EMAIL, akMT('disable'));

      expect(
        (await dialog()).querySelector('[data-test-mfa-disable-send-confirm] strong')
      ).toHaveTextContent(user.email ?? '');

      await pressInDialog(akMT('continue'));

      expect(await dialog()).toHaveTextContent(
        `${akMT('modalCard.disableMFA.enterOTP')} ${akMT('modalCard.disableMFA.viaEmail')}`
      );

      await typeCode(code);
      await pressInDialog(akMT('confirm'));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(bodies).toEqual([{ method: EMAIL }, { method: EMAIL, otp: code }]);
    });

    it('asks for the app’s code straight away for app MFA', async () => {
      mockSignedInUser();
      mockMfaMethods(APP);
      const code = otp();
      const bodies = answerDeletes();

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(APP, akMT('disable'));

      expect(await dialog()).toHaveTextContent(
        `${akMT('modalCard.disableMFA.enterOTP')} ${akMT('modalCard.disableMFA.viaApp')}`
      );

      expect(
        within(await dialog()).queryByRole('button', { name: akMT('continue') })
      ).not.toBeInTheDocument();

      await typeCode(code);
      await pressInDialog(akMT('confirm'));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(bodies).toEqual([{ method: APP, otp: code }]);
    });

    it('repeats irene’s mandated-MFA notice above the code, as irene does', async () => {
      mockSignedInUser();
      mockMfaMethods(APP);

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(APP, akMT('disable'));

      expect(await dialog()).toHaveTextContent(akMT('disableMFADenied'));
    });

    it('closes and says so when the code cannot be sent', async () => {
      mockSignedInUser();
      mockMfaMethods(EMAIL);

      answerDeletes(() =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      );

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(EMAIL, akMT('disable'));
      await pressInDialog(akMT('continue'));

      expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('says something went wrong when the code is refused for another reason', async () => {
      mockSignedInUser();
      mockMfaMethods(APP);
      answerDeletes(() => HttpResponse.json({}, { status: HTTP_STATUS_CODES.FORBIDDEN }));

      await renderAtRoute(SECURITY_SETTINGS);
      await pressInRow(APP, akMT('disable'));
      await typeCode(otp());
      await pressInDialog(akMT('confirm'));

      expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
    });
  });
});
