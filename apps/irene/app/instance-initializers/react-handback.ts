import type ApplicationInstance from '@ember/application/instance';
import type RouterService from '@ember/routing/router-service';
import type Transition from '@ember/routing/transition';

/*
  Paths whose screens have moved to the React app.

  This app still declares routes for them, so its own router matches the URL
  and renders its own version without ever asking the server, which is how a
  migrated screen comes back once this app has booted. Each one is handed back
  instead, by loading the URL so the server decides who serves it.

  Only whole screens the React app serves at its own URL. A screen this app
  still serves, whose body is a React component, is not one of these: this app
  owns that URL and renders the component inside its own page.

  Written as paths rather than route names so it can be compared against the
  React app's own list of what this app still owns. A path in both lists would
  send a navigation back and forth between the two apps without end, and
  `ember-paths.test.ts` fails when that happens.
*/
export const REACT_OWNED_PATHS = [
  '/dashboard/home',

  /* Signing in, signing up and recovering a password are all React's now. */
  '/login',
  '/register',
  '/register-via-invite',
  '/recover',
  '/reset',
  '/saml2/redirect',
  '/sso/oidc/redirect',
];

/**
 * The dynamic segments of a route and everything above it, in URL order.
 *
 * `urlFor` takes them positionally, and a route like `/reset/:token` cannot be
 * built without them.
 *
 * @param route - Where the transition is headed.
 * @returns The segment values, outermost first.
 */
function dynamicSegments(route: Transition['to']): string[] {
  const values: string[] = [];

  for (let info = route; info; info = info.parent) {
    const own = Object.values(info.params ?? {}).filter(
      (value): value is string => typeof value === 'string'
    );

    values.unshift(...own);
  }

  return values;
}

/**
 * Whether a URL belongs to the React app.
 *
 * @param url - Where the transition is headed.
 * @returns Whether the React app serves it.
 */
function isReactOwned(url: string) {
  const path = url.split('?')[0] ?? url;

  return REACT_OWNED_PATHS.some(
    (owned) => path === owned || path.startsWith(`${owned}/`)
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
    if (!transition.from || !name) {
      return;
    }

    const url = router.urlFor(name, ...dynamicSegments(transition.to));

    if (!isReactOwned(url)) {
      return;
    }

    transition.abort();

    window.location.assign(url);
  });
}

export default { initialize };
