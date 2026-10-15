import { Switch as SwitchPrimitive } from 'radix-ui';
import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { cn } from '@irene/ui/cn';

import { akToggleThumbVariants, akToggleVariants } from './variants';

type AkToggleProps = ComponentProps<typeof SwitchPrimitive.Root> &
  VariantProps<typeof akToggleVariants>;

/**
 * Turns one setting on or off, taking effect as it is flipped rather than on a
 * submit.
 *
 * Built on Radix's switch, so it reads as a switch to assistive technology and
 * flips on Space. It is a button rather than a checkbox, so it takes its name
 * from `aria-label` or a `<label htmlFor>` pointing at its `id`.
 *
 * @param props.checked - Whether it is on, for a toggle whose state lives elsewhere.
 * @param props.onCheckedChange - Called with the new state; irene's `onChange`.
 * @param props.disabled - Keeps it where it is.
 * @param props.size - Its height: small beside body text, default, or large.
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
