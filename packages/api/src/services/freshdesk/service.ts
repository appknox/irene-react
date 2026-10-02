import { apiRequest } from '@irene/api/request';
import type { ApiFreshdeskAuthentication } from '@irene/api/services/freshdesk';

import { FreshdeskEndpoints } from './endpoints';

/**
 * Signs the account in to the Freshdesk support widget.
 *
 * The widget is a third-party script that knows nothing about our session, so
 * the backend mints a token naming the account and the widget is handed it.
 */
export default class FreshdeskService {
  /**
   * Asks for a token for the signed-in account.
   *
   * The token expires after two hours, and the widget asks for another through
   * its own callback, so this is called again rather than cached.
   *
   * @returns The token, and the name and address it carries.
   */
  public static readonly authenticate = () =>
    apiRequest.post<ApiFreshdeskAuthentication>(FreshdeskEndpoints.authenticate());
}
