import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { akRadioVariants } from '@irene/ui/ak-radio/variants';
import { cn } from '@irene/ui/cn';

/**
 * A set of buttons where exactly one is chosen.
 *
 * Built on the Radix primitive, so the set is announced as a radio group and
 * arrow keys move between its buttons. Use it where the options are few and
 * worth reading at once; a longer list belongs in a select.
 *
 * @param props.className - Classes for the group, which lays its buttons out in a row by default.
 */
function AkRadioGroup({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('flex flex-wrap items-center gap-3.5', className)}
      {...props}
    />
  );
}

type AkRadioProps = ComponentProps<typeof RadioGroupPrimitive.Item> &
  VariantProps<typeof akRadioVariants>;

/**
 * One button of the set.
 *
 * @param props.color - Which colour the selected ring and dot take.
 * @param props.className - Classes for the ring.
 */
function AkRadio({ className, color, ...props }: AkRadioProps) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio"
      className={cn(akRadioVariants({ color }), className)}
      {...props}
    >
      {/* Radix renders the indicator only for the button that is selected. */}
      <RadioGroupPrimitive.Indicator
        data-slot="radio-indicator"
        className="size-2.25 rounded-full bg-current"
      />
    </RadioGroupPrimitive.Item>
  );
}

export { AkRadio, AkRadioGroup };
