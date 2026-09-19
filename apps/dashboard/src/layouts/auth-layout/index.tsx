import type { ReactNode } from 'react';

import { AkDivider } from '@irene/ui/ak-divider';
import { AppLogo } from '@/components/app-logo';

/**
 * The card the signed-out pages share: logo, a divider, then the page.
 *
 * @param props.children - The page.
 * @param props.footer - Sits below the card's divider, e.g. the registration link.
 */
export function AuthLayout({
  children,
  footer,
}: Readonly<{ children: ReactNode; footer?: ReactNode }>) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-105 overflow-hidden rounded-sm border border-border bg-background shadow-3">
        <div className="flex justify-center px-6 pt-5 pb-3.5">
          <AppLogo className="max-h-11 max-w-42" />
        </div>

        <AkDivider />

        <div className="p-10 pt-6">{children}</div>

        {footer && (
          <div className="border-t border-border bg-neutral-100 p-3.5 text-center">{footer}</div>
        )}
      </div>
    </main>
  );
}
