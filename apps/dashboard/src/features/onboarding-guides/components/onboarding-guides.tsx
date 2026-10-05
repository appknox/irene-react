import { useMemo, useState } from 'react';

import {
  AkModal,
  AkModalBody,
  AkModalContent,
  AkModalHeader,
  AkModalTrigger,
} from '@irene/ui/ak-modal';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

import {
  buildOnboardingGuides,
  type OnboardingGuideProduct,
} from '@/features/onboarding-guides/guides';

import { useServerConfiguration } from '@/hooks/use-server-configuration';

interface OnboardingGuidesProps {
  product: OnboardingGuideProduct;
}

/**
 * The walkthroughs an account can watch without leaving the page.
 *
 * Each one is a recording hosted outside the product, so the panel holds a
 * frame and a list of what to put in it. A self-hosted install is not offered
 * them, because they are recorded against the hosted product.
 *
 * @param props.product - Whose walkthroughs to list, since each has its own.
 */
export function OnboardingGuides({ product }: Readonly<OnboardingGuidesProps>) {
  const { isEnterprise } = useServerConfiguration();

  const categories = useMemo(() => buildOnboardingGuides(product), [product]);
  const guides = useMemo(() => categories.flatMap((category) => category.guides), [categories]);
  const [watchingId, setWatchingId] = useState(guides[0].id);

  /*
    Read back from the guides on show, so switching product falls to its first
    one rather than holding an id the new list does not have.
  */
  const watching = useMemo(
    () => guides.find((guide) => guide.id === watchingId) ?? guides[0],
    [guides, watchingId]
  );

  if (isEnterprise) {
    return null;
  }

  return (
    <AkModal>
      <AkModalTrigger asChild>
        <AkButton
          variant="text"
          color="textPrimary"
          className="
            min-w-20 px-2.5 py-1.25 no-underline
            hover:no-underline
            focus-visible:no-underline
          "
          leftIcon={<AkIcon name="material-symbols:wb-incandescent" className="size-5.25" />}
          data-test-onboarding-guides-trigger
        >
          <AkTypography>{akMT('onboardingGuides')}</AkTypography>
        </AkButton>
      </AkModalTrigger>

      <AkModalContent data-test-onboarding-guides-modal>
        <AkModalHeader title={akMT('onboardingGuides')} closeLabel={akMT('close')} />

        <AkModalBody noGutter className="flex">
          <nav className="h-101.75 w-50 shrink-0 overflow-y-auto border-r border-neutral-100">
            {categories.map(({ category, guides }) => (
              <div key={category}>
                <AkTypography variant="h6" className="mt-1 ml-1 p-2.5">
                  {category}
                </AkTypography>

                {guides.map((guide) => (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() => setWatchingId(guide.id)}
                    className={cn(
                      `
                        flex w-full cursor-pointer border-b border-neutral-100 px-3.5 py-2.5
                        text-left
                      `,
                      guide.id === watching.id ? 'bg-primary/20' : 'hover:bg-black/4'
                    )}
                    data-test-onboarding-guides-item={guide.id}
                  >
                    <AkTypography variant="body1">{guide.title}</AkTypography>
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="relative m-1.75 h-98.25 min-w-175 overflow-hidden">
            <AkSkeleton variant="rectangular" width="100%" height="100%" />

            {/*
              Keyed by the guide, so choosing another builds a new frame rather
              than leaving the one playing to load over itself.
            */}
            <iframe
              key={watching.id}
              src={watching.url}
              title={watching.title}
              allow="autoplay; fullscreen"
              allowFullScreen
              className="absolute inset-0 size-full border-0"
              data-test-onboarding-guides-frame={watching.id}
            />
          </div>
        </AkModalBody>
      </AkModalContent>
    </AkModal>
  );
}
