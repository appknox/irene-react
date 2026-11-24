import { useMatches } from '@tanstack/react-router';

import { AkBreadcrumbs, type AkBreadcrumb } from '@irene/ui/ak-breadcrumbs';
import { AkRouterLink } from '@irene/ui/ak-router-link';

/**
 * Where one page sits, as its route declares it.
 *
 * A crumb names the page and, through `parent`, the pages it hangs off, which
 * is how irene's controllers declare theirs. Only the ones above the open page
 * carry a `to`: the open page is where the reader already is.
 *
 * @interface RouteBreadcrumb
 * @property {string} title - What the page is called in the trail.
 * @property {string} [to] - Where it is, for a page above the open one.
 * @property {RouteBreadcrumb} [parent] - The page it hangs off.
 */
export interface RouteBreadcrumb {
  title: string;
  to?: string;
  parent?: RouteBreadcrumb;
}

/** Walks a crumb's parents, outermost first, as the trail reads. */
function trailFrom(crumb: RouteBreadcrumb): RouteBreadcrumb[] {
  const trail = [crumb];

  for (let step = crumb.parent; step !== undefined; step = step.parent) {
    trail.unshift(step);
  }

  return trail;
}

/**
 * The trail above the open page, assembled from the route rather than written
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
  const matches = useMatches();

  const declared = matches
    .map((match) =>
      match.staticData.breadcrumb?.({
        params: match.params as Record<string, string>,
        search: match.search as Record<string, unknown>,
        context: match.context,
        loaderData: match.loaderData,
        pathname: match.pathname,
      })
    )
    .filter((crumb) => crumb !== undefined);

  /* The deepest route that names itself owns the trail; its parents complete it. */
  const deepest = declared.at(-1);

  if (deepest === undefined) {
    return null;
  }

  const items: AkBreadcrumb[] = trailFrom(deepest).map((crumb) => ({
    title: crumb.title,

    link: crumb.to && (
      <AkRouterLink color="textSecondary" to={crumb.to} data-test-breadcrumb-link>
        {crumb.title}
      </AkRouterLink>
    ),
  }));

  return <AkBreadcrumbs items={items} />;
}
