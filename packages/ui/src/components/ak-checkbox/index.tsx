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
    /*
      The box sits in a padded, round field of its own, as irene's does: 6px of padding
      around a 21px slot, which is what spaces a box from the label beside it and what the
      hover shows on. The slot is the size of irene's own glyph; the box drawn inside it is
      smaller, exactly as that glyph's square is.
    */
    <span
      className={cn(
        'group/checkbox inline-flex rounded-full p-1.5 transition-colors',
        /* irene leaves the hover off a box that cannot be ticked. */
        'hover:bg-hover-light has-[:disabled]:hover:bg-transparent'
      )}
      data-slot="checkbox-field"
    >
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
