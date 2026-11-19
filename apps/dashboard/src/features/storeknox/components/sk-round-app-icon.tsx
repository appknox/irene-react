import { useState } from 'react';

import { AkIcon } from '@irene/ui/ak-icon';
import { cn } from '@irene/ui/cn';

interface SkRoundAppIconProps {
  /** The icon's URL; an empty string shows the placeholder. */
  src: string;
  /**
   * The icon's accessible name; pass an empty string where a title beside it already names the
   * app.
   */
  alt: string;
  /** The size, and any border or fit, of the icon and of its placeholder. */
  className?: string;
}

/**
 * A round app icon, or a round placeholder when the app has no icon or the image fails to load.
 * The headers, the original-app panel and the fake-app list rows all show it, so the fallback is
 * drawn once. The placeholder is hidden from assistive tech when `alt` is empty, as the image is.
 *
 * @param props.src - The icon's URL.
 * @param props.alt - The accessible name; empty marks the icon decorative.
 * @param props.className - The size and any extra classes, applied to both the image and the
 *   placeholder.
 */
export function SkRoundAppIcon({ src, alt, className }: Readonly<SkRoundAppIconProps>) {
  // Keyed to the URL that failed, so a new src gets another attempt.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <span
        data-test-sk-round-app-icon-placeholder
        aria-hidden={alt === '' ? true : undefined}
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-background-subtle',
          className
        )}
      >
        <AkIcon name="hugeicons:image-03" className="text-foreground-muted" />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('shrink-0 rounded-full object-contain', className)}
      onError={() => setFailedSrc(src)}
    />
  );
}
