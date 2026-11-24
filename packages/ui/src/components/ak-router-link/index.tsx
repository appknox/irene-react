import { createLink } from '@tanstack/react-router';

import { AkLink } from '@irene/ui/ak-link';

/**
 * A link that navigates within the application rather than loading it again.
 *
 * It is `AkLink` behind the router's own link, so it is styled like every
 * other link and typed against the application's routes: `to` names a route,
 * `search` and `params` what it opens with, and an address the routes do not
 * name will not compile.
 *
 * Reach for it for anywhere inside this application. `AkLink` itself stays the
 * plain anchor, for an address the router does not own — another site, a
 * download, a file served by the API — and for one opened in a new tab
 * through `target`, which this component also passes through: the router
 * leaves a link with a target to the browser, which opens it as a new
 * document.
 *
 * @example
 * <AkRouterLink to="/dashboard/organization/teams" search={{ team_query: 'Platform' }}>
 *   Platform
 * </AkRouterLink>
 */
const AkRouterLink = createLink(AkLink);

export { AkRouterLink };
