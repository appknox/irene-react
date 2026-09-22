import { apiRequest } from '@irene/api/request';
import type { ApiRegistrationRequest } from '@irene/api/services/registration';

import { RegistrationEndpoints } from './endpoints';

/** Opens an account for someone who does not have one. */
export default class RegistrationService {
  /**
   * Registers an account. The backend answers 204 whether the address is new or
   * already registered, and emails the address either way, so nothing here
   * reveals who has an account.
   *
   * @param registration - The address, company, name and reCAPTCHA token.
   */
  public static readonly register = (registrationData: ApiRegistrationRequest) =>
    apiRequest.post<void>(RegistrationEndpoints.register(), registrationData);
}
