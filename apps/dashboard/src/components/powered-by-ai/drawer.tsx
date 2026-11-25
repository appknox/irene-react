import { Fragment, useState, type ReactNode } from 'react';

import {
  AkDrawer,
  AkDrawerBody,
  AkDrawerContent,
  AkDrawerFooter,
  AkDrawerHeader,
  AkDrawerTrigger,
} from '@irene/ui/ak-drawer';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

import { PoweredByAiChip } from './chip';

/**
 * One thing the drawer explains: a heading, and either a paragraph or a list.
 *
 * The body is rendered rather than read as text, since some of these messages
 * carry markup of their own — a line break between two paragraphs, say.
 */
export interface PoweredByAiSection {
  title: string;
  body?: ReactNode;
  points?: string[];
}

interface PoweredByAiDrawerProps {
  sections: PoweredByAiSection[];
  variant?: 'filled' | 'outlined';

  /** Held open by the screen instead of by its own chip, for one opened by something else. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  /** What the drawer asks for, where it is opened to confirm something rather than to explain. */
  action?: { label: string; isWorking?: boolean; onConfirm: () => void };
}

/**
 * What the AI behind a screen does with an account's data, opened from its chip.
 *
 * Every AI feature answers the same three questions, so the drawer renders
 * whatever sections it is handed rather than holding the copy itself: each
 * feature words them for what it does.
 *
 * Where a screen turns one of these features on or off, the drawer is what it
 * asks over: the screen holds it open and hands it the action, so what the AI
 * does with the account's data is read before the answer is given.
 *
 * @param props.sections - What to explain, in the order it is read.
 * @param props.variant - Which chip to draw, matching the surface it opens from.
 * @param props.open - Held open by the screen, for one opened by something other than its chip.
 * @param props.onOpenChange - Called as it opens and closes, where the screen holds it open.
 * @param props.action - What it asks for, where it is asking rather than explaining.
 */
export function PoweredByAiDrawer({
  sections,
  variant = 'filled',
  open,
  onOpenChange,
  action,
}: Readonly<PoweredByAiDrawerProps>) {
  const [isOpenItself, setIsOpenItself] = useState(false);

  const isHeldOpen = open !== undefined;
  const isOpen = isHeldOpen ? open : isOpenItself;

  const setOpen = (next: boolean) => {
    if (isHeldOpen) {
      onOpenChange?.(next);

      return;
    }

    setIsOpenItself(next);
  };

  return (
    <AkDrawer open={isOpen} onOpenChange={setOpen}>
      {!isHeldOpen && (
        <AkDrawerTrigger asChild>
          <AkButton
            variant="text"
            size="xs"
            className="
              h-auto self-start p-0 no-underline
              hover:no-underline
              focus-visible:no-underline
            "
            aria-label={akMT('aiPoweredFeatures')}
            data-test-powered-by-ai-trigger
          >
            <PoweredByAiChip variant={variant} clickable />
          </AkButton>
        </AkDrawerTrigger>
      )}

      <AkDrawerContent data-test-powered-by-ai-drawer>
        <AkDrawerHeader title={akMT('aiPoweredFeatures')} closeLabel={akMT('close')} />

        <AkDrawerBody noGutter className="flex flex-col">
          <div
            className="my-4.25 mx-5.5 flex w-160 flex-col items-start border border-border p-5"
            data-test-powered-by-ai-drawer-panel
          >
            <PoweredByAiChip variant={variant} />

            {sections.map((section) => (
              <Fragment key={section.title}>
                {/* irene sets each title 1em from what is above it, and half that from its body. */}
                <AkTypography fontWeight="bold" className="mt-3.5 mb-1.75">
                  {section.title}
                </AkTypography>

                {section.body && <AkTypography variant="body2">{section.body}</AkTypography>}

                {section.points && (
                  <ul
                    className={cn('list-disc pl-3.5', section.body && 'mt-1.75')}
                    data-test-powered-by-ai-drawer-points
                  >
                    {section.points.map((point) => (
                      <li key={point} className="mb-1.75">
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </Fragment>
            ))}
          </div>
        </AkDrawerBody>

        {action && (
          <AkDrawerFooter className="items-center gap-1.75 py-3.5 pl-8.75">
            <AkButton
              loading={action.isWorking}
              onClick={action.onConfirm}
              data-test-powered-by-ai-confirm
            >
              {action.label}
            </AkButton>

            <AkButton
              variant="outlined"
              color="neutral"
              onClick={() => setOpen(false)}
              data-test-powered-by-ai-back
            >
              {akMT('back')}
            </AkButton>
          </AkDrawerFooter>
        )}
      </AkDrawerContent>
    </AkDrawer>
  );
}
