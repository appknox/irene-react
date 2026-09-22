import { useNProgress } from '@tanem/react-nprogress';
import { useEffect, useState } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkProgressLinear } from '@irene/ui/ak-progress-linear';
import MainLoaderImage1 from '@irene/ui/svgs/main-loader-image1.svg?react';
import MainLoaderImage2 from '@irene/ui/svgs/main-loader-image2.svg?react';
import MainLoaderImage3 from '@irene/ui/svgs/main-loader-image3.svg?react';

const LOADER_IMAGES = [MainLoaderImage1, MainLoaderImage2, MainLoaderImage3];
const IMAGE_INTERVAL_MS = 1000;
const COMPLETION_PERCENTAGE = 100;

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
  const [imageIndex, setImageIndex] = useState(0);
  const { progress } = useNProgress({ isAnimating: routeProgress === undefined });
  const LoaderImage = LOADER_IMAGES[imageIndex] ?? MainLoaderImage1;

  // Handles the image animation.
  useEffect(() => {
    const imageIdxIncrement = () => setImageIndex((idx) => (idx + 1) % LOADER_IMAGES.length);
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

      <AkProgressLinear
        value={routeProgress ?? progress * COMPLETION_PERCENTAGE}
        label={akMT('loadingTheDashboard')}
        className="mt-12 w-full max-w-80"
      />
    </main>
  );
}
