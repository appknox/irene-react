import type ApplicationInstance from '@ember/application/instance';
import type RouterService from '@ember/routing/router-service';
import type Transition from '@ember/routing/transition';

/*
  Routes whose screens have moved to the React app.

  This app still declares them, so its own router matches the URL and renders
  its own version without ever asking the server, which is how a migrated
  screen comes back once this app has booted. Each one is handed back instead,
  by loading the URL so the server decides who serves it.

  The mirror of the React app's own list of what this app still owns. A screen
  is migrated by adding it here and removing it there.
*/
const REACT_OWNED_ROUTES = [
  'authenticated.dashboard.home',
  'authenticated.dashboard.account-settings',
];

/** Whether a route, or anything under it, is the React app's to render. */
function isReactOwned(name: string) {
  return REACT_OWNED_ROUTES.some(
    (route) => name === route || name.startsWith(`${route}.`)
  );
}

/**
 * Loads the React app for any screen that has moved to it.
 *
 * @param owner - The application instance this is wired into.
 */
export function initialize(owner: ApplicationInstance) {
  const router = owner.lookup('service:router') as RouterService;

  router.on('routeWillChange', (transition: Transition) => {
    const name = transition.to?.name;

    /* Only a move within this app: on the first one there is nothing to leave. */
    if (!transition.from || !name || !isReactOwned(name)) {
      return;
    }

    transition.abort();

    window.location.assign(router.urlFor(name));
  });
}

export default { initialize };
