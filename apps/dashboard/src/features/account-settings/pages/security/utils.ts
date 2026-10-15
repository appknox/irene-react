import { getApiFieldErrors, unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { akNotify } from '@irene/ui/notify';

/**
 * Whether the server refused a step because it needs an OTP, or because the
 * OTP it was given is wrong. Both answer with a message on the `otp` field.
 *
 * @param error - Whatever the request rejected with.
 * @returns Whether the refusal names the OTP.
 */
export const isOtpRefusal = (error: unknown) => Boolean(getApiFieldErrors(error).otp?.length);

/**
 * Tells the user why a step that carried an OTP was refused: the code was
 * wrong, or something else went wrong. A throttled account is already shown
 * the rate-limit notice, so it is told nothing more.
 */
export const notifyOtpStepFailed = unlessRateLimited((error: unknown) => {
  akNotify.error(isOtpRefusal(error) ? akMT('invalidOTP') : akMT('somethingWentWrong'));
});

/**
 * Sends a code once one is typed, and says a code is needed when none is, as
 * irene does before every step that carries one.
 *
 * @param otp - The code typed so far.
 * @param send - Sends it.
 */
export function sendOtpIfTyped(otp: string, send: () => void) {
  if (otp) {
    send();
  } else {
    akNotify.error(akMT('enterOTP'));
  }
}
