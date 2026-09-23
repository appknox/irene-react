import type { ReactNode } from 'react';

import { AkDivider } from '@irene/ui/ak-divider';
import { cn } from '@irene/ui/cn';
import { AppLogo } from '@/components/app-logo';
import { LanguageSwitcher } from '@/features/auth/components/language-switcher';

/**
 * The card the signed-out pages share: logo, a divider, then the page. The
 * language sits in the page's corner, since nobody has signed in to have one
 * of their own yet.
 *
 * @param props.children - The page.
 * @param props.footer - Sits below the card's divider, e.g. the registration link.
 * @param props.cardClassName - Overrides the card, for a page that needs a wider one.
 */
export function AuthLayout({
  children,
  footer,
  cardClassName,
}: Readonly<{ children: ReactNode; footer?: ReactNode; cardClassName?: string }>) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <div
        className={cn(
          'w-full max-w-105 overflow-hidden rounded-sm border border-border bg-background shadow-3',
          cardClassName
        )}
      >
        <div className="flex justify-center px-6 pt-5 pb-3.5">
          <AppLogo className="max-h-11 max-w-42" />
        </div>

        <AkDivider />

        <div className="p-10 pt-6">{children}</div>

        {footer && (
          <div className="border-t border-border bg-neutral-100 p-3.5 text-center empty:hidden">
            {footer}
          </div>
        )}
      </div>

      <div className="mt-8">
        <LanguageSwitcher />
      </div>
    </main>
  );
}
