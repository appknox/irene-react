import type { ComponentProps } from 'react';
import { cn } from '@irene/ui/cn';

/*
  irene caps a page's content inside its wrapper, at 1200px or a page's own wider limit, so a
  banner above the wrapper still spans the frame. The cap here is that content width plus the
  wrapper's 21px padding on each side: 1242px, and 1382px for irene's 1340px pages.
*/
const _CONTENT_WIDTH = {
  standard: cn('mx-auto max-w-310.5'),
  wide: cn('mx-auto max-w-345.5'),
};

interface PageWrapperProps extends ComponentProps<'div'> {
  contentWidth?: keyof typeof _CONTENT_WIDTH;
}

/**
 * The padding a page's content sits in: 14px above and 21px elsewhere, the net of irene's 7px
 * layout padding and its wrapper's -7px margin.
 *
 * A layout that caps its pages leaves `contentWidth` unset. A layout that does not, so that a
 * banner above the page can span the frame as irene's do, has each page cap its own content.
 *
 * @param props.contentWidth - Caps and centres the page at irene's content width: `standard` for
 *   its 1200px, `wide` for the 1340px a few pages use.
 * @param props.className - Merged over the padding, to drop a side where a page splits the frame.
 */
export function PageWrapper({ contentWidth, className, ...props }: Readonly<PageWrapperProps>) {
  return (
    <div
      className={cn(
        'w-full px-5.25 pt-3.5 pb-5.25',
        contentWidth && _CONTENT_WIDTH[contentWidth],
        className
      )}
      {...props}
    />
  );
}
