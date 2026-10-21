import { useState } from 'react';

import { AkTypography } from '@irene/ui/ak-typography';

import { handOverToEmber } from './ember-paths';

/**
 * Stands in for a page that has a route but no screen yet.
 *
 * Where the Ember app still serves the screen, the browser is sent to its URL.
 * Otherwise the route resolves to this message, so the pages that link to it
 * still work.
 *
 * @param props.name - The page this route will hold, named as its own screen will name it.
 */
export function RouteShell({ name }: Readonly<{ name: string }>) {
  /* Decided once, as the screen is first rendered, rather than on every render. */
  const [isHandingOver] = useState(() => handOverToEmber(window.location.pathname));

  if (isHandingOver) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-2 p-4">
      <AkTypography tag="h1" variant="h4" fontWeight="bold" align="center" className="text-xl">
        {name}
      </AkTypography>

      <AkTypography color="textSecondary" align="center">
        This screen has not been migrated yet.
      </AkTypography>
    </div>
  );
}
