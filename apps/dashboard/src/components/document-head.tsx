import { useMatches } from '@tanstack/react-router';
import { Fragment } from 'react';

import {
  getProductFeatureIdForPath,
  getProductFeatureName,
} from '@/features/dashboard/utils/product-features';

import { useWhitelabel } from '@/hooks/use-whitelabel';

/* The layout every product's pages render in. The landing page opts out of it and names no module. */
const PRODUCT_LAYOUT_ROUTE = '/_authenticated/dashboard';

/** What sits between a page and the one that contains it. */
const TITLE_SEPARATOR = ' | ';

/**
 * How the deployment names itself in the browser tab.
 *
 * Rendered rather than assigned: React hoists `title`, `meta` and `link` into
 * the document head, so the tab follows the branding the way any other element
 * follows its state.
 *
 * The tab reads from the page outwards to the product, so a row of tabs stays
 * readable while every one of them belongs to the same product.
 */
export function DocumentHead() {
  const { name, favicon, isAppknoxUrl } = useWhitelabel();
  const matches = useMatches();
  const productLayout = matches.some((match) => match.routeId === PRODUCT_LAYOUT_ROUTE);

  /* The module the page belongs to, named as this install names it. */
  const productName = productLayout
    ? getProductFeatureName(
        getProductFeatureIdForPath(matches.at(-1)?.pathname ?? ''),
        isAppknoxUrl
      )
    : undefined;

  /*
    Every level that names a page contributes, deepest first, with the product
    last. A level that names none simply adds nothing.
  */
  const matchingRoutePageTitles = matches
    .map((match) => match.staticData.pageTitle?.(match))
    .filter(Boolean)
    .reverse();

  /* A page that is its own module names it once: "Reports | Appknox", never "Reports | Reports". */
  const segments = [...matchingRoutePageTitles, productName, name].filter(
    (segment, index, all) => segment && segment !== all[index + 1]
  );

  const pageTitle = segments.join(TITLE_SEPARATOR);

  return (
    <Fragment>
      <title>{pageTitle}</title>

      <meta property="og:title" content={pageTitle} />

      {favicon && <link rel="shortcut icon" href={favicon} />}
    </Fragment>
  );
}
