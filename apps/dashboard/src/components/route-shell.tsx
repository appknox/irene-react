import { AkTypography } from '@irene/ui/ak-typography';

/**
 * Stands in for a page that has a route but no screen yet.
 *
 * The home page links to every product, so those routes have to resolve before
 * it is worth anything. Each one is replaced by its real page as that page is
 * migrated, and this component goes when the last of them has been.
 *
 * @param props.name - The page this route will hold, named as its own screen will name it.
 */
export function RouteShell({ name }: Readonly<{ name: string }>) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-4">
      <AkTypography tag="h1" variant="h4" fontWeight="bold" align="center" className="text-xl">
        {name}
      </AkTypography>

      <AkTypography color="textSecondary" align="center">
        This screen has not been migrated yet.
      </AkTypography>
    </main>
  );
}
