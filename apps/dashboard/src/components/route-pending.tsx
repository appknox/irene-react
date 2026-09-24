import { useNProgress } from '@tanem/react-nprogress';
import { useEffect, useState } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkProgressLinear } from '@irene/ui/ak-progress-linear';
import { AkTypography } from '@irene/ui/ak-typography';
import MainLoaderImage1 from '@irene/ui/svgs/main-loader-image1.svg?react';
import MainLoaderImage2 from '@irene/ui/svgs/main-loader-image2.svg?react';
import MainLoaderImage3 from '@irene/ui/svgs/main-loader-image3.svg?react';

const LOADER_IMAGES = [MainLoaderImage1, MainLoaderImage2, MainLoaderImage3];

/**
 * Which illustration is on screen, and which follows it. Written out rather
 * than derived with a modulo so the lookup is total: an index arrived at by
 * arithmetic is possibly-undefined to the compiler, and the fallback it then
 * needs can never run. Add an image here and in `LOADER_IMAGES` together.
 */
type LoaderImageIndex = 0 | 1 | 2;

const NEXT_LOADER_IMAGE_INDEX: Record<LoaderImageIndex, LoaderImageIndex> = { 0: 1, 1: 2, 2: 0 };
const IMAGE_INTERVAL_MS = 1000;
const COMPLETION_PERCENTAGE = 100;

/**
 * What the screen says as a wait runs on, and how far in it says it.
 *
 * Under the first mark a bar that is still moving says enough. Past it the
 * reader starts to wonder whether anything is happening, so the screen keeps
 * them company. Each stage reassures rather than explains: what the backend is
 * doing is not theirs to fix, and naming it only makes the wait read as broken.
 */
const waitingMessages = () => [
  { afterMs: 40_000, text: akMT('bootLoadingScreenMsg.thanksForYourPatience') },
  { afterMs: 25_000, text: akMT('bootLoadingScreenMsg.almostThere') },
  { afterMs: 10_000, text: akMT('bootLoadingScreenMsg.stillGettingThingsReady') },
];

/** How often the elapsed wait is re-read, which sets how sharp each mark is. */
const WAITING_TICK_MS = 1000;

/**
 * Shown while a route's guards and loaders run. The illustration cycles and the
 * bar creeps because a wait that shows no movement reads as a wait that failed.
 *
 * The bar is driven by the same trickle as the one across the top of the page,
 * so a wait moves at one pace wherever it is shown.
 *
 * @param props.progress - How far along to draw the bar, 0 to 100. Left out, it
 * runs its own trickle, which cannot complete because the screen is replaced the
 * moment the wait ends.
 */
export function RoutePending({ progress: routeProgress }: Readonly<{ progress?: number }>) {
  const [imageIndex, setImageIndex] = useState<LoaderImageIndex>(0);
  const [waitedMs, setWaitedMs] = useState(0);
  const { progress } = useNProgress({ isAnimating: routeProgress === undefined });
  const LoaderImage = LOADER_IMAGES[imageIndex];
  const waitingMessage = waitingMessages().find((message) => waitedMs >= message.afterMs);

  // Counts the wait, which is what decides how much the screen says about it.
  useEffect(() => {
    const waitTicker = setInterval(
      () => setWaitedMs((waited) => waited + WAITING_TICK_MS),
      WAITING_TICK_MS
    );

    return () => clearInterval(waitTicker);
  }, []);

  // Handles the image animation.
  useEffect(() => {
    const imageIdxIncrement = () => setImageIndex((index) => NEXT_LOADER_IMAGE_INDEX[index]);
    const imagesInterval = setInterval(imageIdxIncrement, IMAGE_INTERVAL_MS);

    return () => clearInterval(imagesInterval);
  }, []);

  return (
    <main
      role="status"
      aria-live="polite"
      aria-label={akMT('loadingTheDashboard')}
      className="flex min-h-screen flex-col items-center justify-center p-4"
      data-test-route-pending
    >
      <LoaderImage className="max-w-60" aria-hidden />

      <div className="relative mt-12 w-full max-w-80">
        <AkProgressLinear
          value={routeProgress ?? progress * COMPLETION_PERCENTAGE}
          label={akMT('loadingTheDashboard')}
          className="w-full"
        />

        {waitingMessage && (
          <AkTypography
            color="textSecondary"
            align="center"
            className="absolute inset-x-0 top-full mt-4 text-sm leading-tight"
            data-test-route-pending-wait-message
          >
            {waitingMessage.text}
          </AkTypography>
        )}
      </div>
    </main>
  );
}
