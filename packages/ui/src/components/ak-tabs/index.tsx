import { Tabs as TabsPrimitive } from 'radix-ui';
import { createContext, useContext, type ComponentProps } from 'react';
import { type VariantProps } from 'class-variance-authority';

import { cn } from '@irene/ui/cn';

import { akTabsBadgeVariants, akTabsListVariants, akTabsTriggerVariants } from './variants';

type AkTabsVariant = NonNullable<VariantProps<typeof akTabsListVariants>['variant']>;

/* Carries the list's variant to its tabs, so the variant is set once per row. */
const AkTabsVariantContext = createContext<AkTabsVariant>('line');

/**
 * A set of views, one shown at a time, chosen from a row of tabs.
 *
 * Built on Radix's tabs, so the row reads as a tablist to assistive technology
 * and takes the arrow keys, Home and End. Values are strings: irene's numeric
 * tab ids become their string form.
 *
 * @param props.value - The active tab, for a row whose selection lives elsewhere (a route, a search param).
 * @param props.defaultValue - The tab active on mount, for a row that keeps its own selection.
 * @param props.onValueChange - Called with the chosen tab's value; irene's `onTabClick`.
 * @param props.orientation - Lays the row out horizontally (the default) or vertically.
 * @param props.activationMode - `manual` waits for Enter or Space; use it for tabs that navigate.
 */
function AkTabs({
  className,
  orientation = 'horizontal',
  ...props
}: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      orientation={orientation}
      className={cn('flex gap-4 data-[orientation=horizontal]:flex-col', className)}
      {...props}
    />
  );
}

/**
 * The row of tabs.
 *
 * @param props.variant - How the active tab is marked: a bar under it (`line`), a raised card
 *   (`shadow`), or a raised pill on a tinted track (`segmented`).
 */
function AkTabsList({
  className,
  variant = 'line',
  ...props
}: ComponentProps<typeof TabsPrimitive.List> & { variant?: AkTabsVariant }) {
  return (
    <AkTabsVariantContext.Provider value={variant}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        className={cn(akTabsListVariants({ variant }), className)}
        {...props}
      />
    </AkTabsVariantContext.Provider>
  );
}

/**
 * One tab. Its children are the label, with an icon before it and an
 * `AkTabsBadge` after it as needed.
 *
 * @param props.value - Which `AkTabsContent` it shows, and what `onValueChange` receives.
 * @param props.disabled - Keeps it in the row but out of reach.
 * @param props.asChild - Makes the child the tab; pass a router link for tabs that navigate.
 */
function AkTabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  const variant = useContext(AkTabsVariantContext);

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(akTabsTriggerVariants({ variant }), className)}
      {...props}
    />
  );
}

/**
 * The count beside a tab's label, tinted to follow the tab it sits in.
 *
 * @param props.background - Draws it on a tint (the default), or as bare text.
 */
function AkTabsBadge({
  className,
  background,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof akTabsBadgeVariants>) {
  return (
    <span
      data-slot="tabs-badge"
      className={cn(akTabsBadgeVariants({ background }), className)}
      {...props}
    />
  );
}

/**
 * The view for one tab, rendered while that tab is active.
 *
 * @param props.value - The tab it belongs to.
 * @param props.forceMount - Keeps it mounted while hidden, for a view that holds state.
 */
function AkTabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  );
}

export { AkTabs, AkTabsList, AkTabsTrigger, AkTabsBadge, AkTabsContent };
