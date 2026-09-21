import { useMatches } from '@tanstack/react-router';
import { Fragment } from 'react';

import { useWhitelabel } from '@/hooks/use-whitelabel';

/** What sits between a page and the one that contains it. */
const TITLE_SEPARATOR = ' | ';

/**
 * How the deployment names itself in the browser chrome.
 *
 * Rendered rather than assigned: React hoists `title`, `meta` and `link` into
 * the document head, so the tab follows the branding the way any other element
 * follows its state.
 *
 * The tab reads from the page outwards to the product, so a row of tabs stays
 * readable while every one of them belongs to the same product.
 */
export function DocumentHead() {
  const { name, favicon } = useWhitelabel();
  const matches = useMatches();

  /*
    Every level that names a page contributes, deepest first, with the product
    last. A level that names none simply adds nothing.
  */
  const matchingRoutePageTitles = matches
    .map((match) => match.staticData.pageTitle?.(match))
    .filter(Boolean)
    .reverse();

  const pageTitle = [...matchingRoutePageTitles, name].join(TITLE_SEPARATOR);

  return (
    <Fragment>
      <title>{pageTitle}</title>

      <meta property="og:title" content={pageTitle} />

      {favicon && <link rel="shortcut icon" href={favicon} />}
    </Fragment>
  );
}
