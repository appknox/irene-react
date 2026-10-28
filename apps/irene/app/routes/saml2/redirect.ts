import Route from '@ember/routing/route';

import config from 'irene/config/environment';

/**
 * The provider sends the user back here with a token in the query.
 *
 * The exchange and everything it shows belong to the React page this route
 * renders, which reads the query itself.
 */
export default class Saml2RedirectRoute extends Route {
  title = `Redirect${config.platform}`;

  queryParams = {
    sso_token: { refreshModel: true },
    err: { refreshModel: true },
  };
}
