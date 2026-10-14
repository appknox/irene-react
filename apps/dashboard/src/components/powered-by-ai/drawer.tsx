import { Fragment, useState } from 'react';

import {
  AkDrawer,
  AkDrawerBody,
  AkDrawerContent,
  AkDrawerHeader,
  AkDrawerTrigger,
} from '@irene/ui/ak-drawer';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';

import { PoweredByAiChip } from './chip';

/** One thing the drawer explains: a heading, and either a paragraph or a list. */
export interface PoweredByAiSection {
  title: string;
  body?: string;
  points?: string[];
}

interface PoweredByAiDrawerProps {
  sections: PoweredByAiSection[];
  variant?: 'filled' | 'outlined';
}

/**
 * What the AI behind a screen does with an account's data, opened from its chip.
 *
 * Every AI feature answers the same three questions, so the drawer renders
 * whatever sections it is handed rather than holding the copy itself: each
 * feature words them for what it does.
 *
 * @param props.sections - What to explain, in the order it is read.
 * @param props.variant - Which chip to draw, matching the surface it opens from.
 */
export function PoweredByAiDrawer({
  sections,
  variant = 'filled',
}: Readonly<PoweredByAiDrawerProps>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AkDrawer open={isOpen} onOpenChange={setIsOpen}>
      <AkDrawerTrigger asChild>
        <AkButton
          variant="text"
          size="xs"
          className="h-auto p-0 no-underline hover:no-underline focus-visible:no-underline"
          aria-label={akMT('aiPoweredFeatures')}
          data-test-powered-by-ai-trigger
        >
          <PoweredByAiChip variant={variant} clickable />
        </AkButton>
      </AkDrawerTrigger>

      <AkDrawerContent data-test-powered-by-ai-drawer>
        <AkDrawerHeader title={akMT('aiPoweredFeatures')} closeLabel={akMT('close')} />

        <AkDrawerBody noGutter className="flex flex-col">
          <div
            className="
              my-4.25 mx-5.5 flex w-160 flex-col items-start gap-2 border border-border p-5
            "
            data-test-powered-by-ai-drawer-panel
          >
            <PoweredByAiChip variant={variant} />

            {sections.map((section) => (
              <Fragment key={section.title}>
                <AkTypography fontWeight="bold" className="mt-2">
                  {section.title}
                </AkTypography>

                {section.body && <AkTypography variant="body2">{section.body}</AkTypography>}

                {section.points && (
                  <ul className="list-disc pl-4.5" data-test-powered-by-ai-drawer-points>
                    {section.points.map((point) => (
                      <li key={point} className="mb-1">
                        <AkTypography variant="body2">{point}</AkTypography>
                      </li>
                    ))}
                  </ul>
                )}
              </Fragment>
            ))}
          </div>
        </AkDrawerBody>
      </AkDrawerContent>
    </AkDrawer>
  );
}
