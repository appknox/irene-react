import { type ReactNode } from 'react';

import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

interface StoryLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

/**
 * The frame every story renders in, applied as the global decorator.
 *
 * It holds one centred column so a story reads the same wherever it sits in the
 * sidebar, and it keeps a width of its own so an example asked to fill its
 * container has something to fill. The title names the story on the canvas,
 * where the sidebar entry is otherwise the only thing that does.
 *
 * @param props.children - The story.
 * @param props.title - What the story shows.
 * @param props.description - The line under the title.
 */
function StoryLayout({ children, title, description }: Readonly<StoryLayoutProps>) {
  return (
    <div className={cn('flex min-h-dvh w-full justify-center p-8')}>
      <div className={cn('flex w-full max-w-200 flex-col items-center gap-8')}>
        {title && <StoryHeading title={title} description={description} />}

        {children}
      </div>
    </div>
  );
}

interface StorySectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * One titled example within a story, for a story that shows several.
 *
 * @param props.title - What the example below it shows.
 * @param props.description - The line under the title.
 * @param props.children - The example.
 * @param props.className - Classes for the element the example sits in.
 */
function StorySection({ title, description, children, className }: Readonly<StorySectionProps>) {
  return (
    <section className={cn('flex w-full flex-col items-center gap-3')}>
      <StoryHeading title={title} description={description} />

      <div className={cn('flex flex-col items-center gap-3', className)}>{children}</div>
    </section>
  );
}

/**
 * The title a story or one of its sections is read by.
 *
 * @param props.title - The heading.
 * @param props.description - The line under it.
 */
function StoryHeading({ title, description }: Readonly<{ title: string; description?: string }>) {
  return (
    <div className={cn('flex flex-col items-center gap-1 text-center')}>
      <AkTypography variant="subtitle2" color="textSecondary">
        {title}
      </AkTypography>

      {description && (
        <AkTypography variant="body3" color="textSecondary" className={cn('max-w-150')}>
          {description}
        </AkTypography>
      )}
    </div>
  );
}

export { StoryLayout, StorySection };
