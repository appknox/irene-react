import { useMatches, useRouter, type AnyRouter } from '@tanstack/react-router';

import { AkBreadcrumbs, type AkBreadcrumb } from '@irene/ui/ak-breadcrumbs';
import { AkLink } from '@irene/ui/ak-link';
import type { RouterPageTitleContext } from '@/router';

/**
 * Where one page sits, as its route declares it.
 *
 * A route names itself and, through `parent`, the address of the page it hangs
 * off. That page's own route names the rest, so the trail is assembled from the
 * routes rather than spelled out again at each leaf — which is how irene's
 * controllers declare theirs.
 *
 * @interface RouteBreadcrumb
 * @property {string} title - What the page is called in the trail.
 * @property {string} [to] - Where it is, for a page above the open one.
 * @property {string} [parent] - The address of the page it hangs off.
 */
export interface RouteBreadcrumb {
  title: string;
  to?: string;
  parent?: string;
}

/* How far a trail may be walked, which stops a parent that leads back to itself. */
const MAX_TRAIL_LENGTH = 8;

/** What the route at one address declares about itself, where it declares anything. */
function crumbAt(
  router: AnyRouter,
  address: string,
  context: RouterPageTitleContext
): RouteBreadcrumb | undefined {
  const route = Object.entries(router.routesByPath).find(([path]) => path === address)?.[1];

  return route?.options.staticData?.breadcrumb?.(context);
}

/**
 * The trail above one crumb, outermost first.
 *
 * Each step names the address of the one above it, and the route at that
 * address is asked what it is called, up to the first one that names no parent.
 */
function trailFrom(
  router: AnyRouter,
  crumb: RouteBreadcrumb,
  context: RouterPageTitleContext
): RouteBreadcrumb[] {
  const trail = [crumb];
  let address = crumb.parent;

  while (address !== undefined && trail.length < MAX_TRAIL_LENGTH) {
    const declared = crumbAt(router, address, context);

    if (declared === undefined) {
      break;
    }

    /* The address the trail reached it by, rather than one that route repeats. */
    trail.unshift({ ...declared, to: address });

    address = declared.parent;
  }

  return trail;
}

/**
 * The trail above the open page, assembled from the routes rather than written
 * out by the screen.
 *
 * Each route declares its own crumb in `staticData`, as irene's controllers
 * declare theirs, so a screen renders this and nothing else: adding a page to
 * the trail is a change to that page's route.
 *
 * Renders nothing where no open route names itself, so a screen may hold it
 * unconditionally.
 */
export function Breadcrumbs() {
  const router = useRouter();
  const matches = useMatches();

  const contextOf = (match: (typeof matches)[number]): RouterPageTitleContext => ({
    params: match.params as Record<string, string>,
    search: match.search as Record<string, unknown>,
    context: match.context,
    loaderData: match.loaderData,
    pathname: match.pathname,
  });

  const declared = matches
    .map((match) => ({ match, crumb: match.staticData.breadcrumb?.(contextOf(match)) }))
    .filter((named) => named.crumb !== undefined);

  /* The deepest route that names itself owns the trail; the routes above it complete it. */
  const deepest = declared.at(-1);

  if (deepest?.crumb === undefined) {
    return null;
  }

  const items: AkBreadcrumb[] = trailFrom(router, deepest.crumb, contextOf(deepest.match)).map(
    (crumb) => ({
      title: crumb.title,

      /* A crumb climbs out of the open page, whose address may be served elsewhere, so
         it hands the address over rather than resolving it against the open router. */
      link: crumb.to && (
        <AkLink color="textSecondary" underline="hover" href={crumb.to} data-test-breadcrumb-link>
          {crumb.title}
        </AkLink>
      ),
    })
  );

  return <AkBreadcrumbs items={items} />;
}
