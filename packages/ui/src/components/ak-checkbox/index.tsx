import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { akCheckboxVariants } from '@irene/ui/ak-checkbox/variants';
import { AkIcon } from '@irene/ui/ak-icon';
import { cn } from '@irene/ui/cn';

type AkCheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root> &
  VariantProps<typeof akCheckboxVariants>;

/**
 * A box the user ticks, for a choice with two states — or three, where it
 * stands for a group whose members disagree.
 *
 * Built on the Radix primitive, so it is a real checkbox to assistive
 * technology and reachable by keyboard, while the mark is ours to style.
 * Pass `checked="indeterminate"` for the part-ticked state, which Radix
 * announces as mixed.
 *
 * @param props.color - Which colour the ticked box takes.
 * @param props.className - Classes for the box.
 */
function AkCheckbox({ className, color, ...props }: AkCheckboxProps) {
  return (
    <span className="group/checkbox relative inline-flex" data-slot="checkbox-field">
      {/* The halo effect of hovering over the checkbox.*/}
      <span className="pointer-events-none absolute -inset-2 rounded-full bg-neutral-100 opacity-0 transition-opacity group-hover/checkbox:opacity-100 group-has-disabled/checkbox:opacity-0" />

      <CheckboxPrimitive.Root
        data-slot="checkbox"
        className={cn(akCheckboxVariants({ color }), className)}
        {...props}
      >
        {/* Radix renders the indicator only for a box that is ticked or part-ticked. */}
        <CheckboxPrimitive.Indicator
          data-slot="checkbox-indicator"
          className="group/indicator flex items-center justify-center text-white"
        >
          <AkIcon
            name="material-symbols:check"
            className="size-4 group-data-[state=indeterminate]/indicator:hidden"
          />

          <AkIcon
            name="material-symbols:remove"
            className="hidden size-4 group-data-[state=indeterminate]/indicator:block"
          />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </span>
  );
}

export { AkCheckbox };
