import { Switch as SwitchPrimitive } from 'radix-ui';
import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { akToggleThumbVariants, akToggleVariants } from '@irene/ui/ak-toggle/variants';
import { cn } from '@irene/ui/cn';

type AkToggleProps = ComponentProps<typeof SwitchPrimitive.Root> &
  VariantProps<typeof akToggleVariants>;

/**
 * A switch, for a setting that is simply on or off.
 *
 * Built on the Radix primitive, so it is announced as a switch and reachable
 * by keyboard, while the track and thumb are ours. Unlike a checkbox it takes
 * effect as it is moved rather than on a later save, so it belongs beside the
 * thing it governs rather than in a form.
 *
 * @param props.size - Which of the three sizes to draw, matching irene's own.
 * @param props.className - Classes for the track.
 */
function AkToggle({ className, size, ...props }: AkToggleProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="toggle"
      className={cn(akToggleVariants({ size }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot="toggle-thumb" className={akToggleThumbVariants({ size })} />
    </SwitchPrimitive.Root>
  );
}

export { AkToggle };
