import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { cn } from '@irene/ui/cn';

import { akRadioDotVariants, akRadioVariants } from './variants';

/**
 * A set of choices of which exactly one holds. Unlike irene's loose radios, the
 * group owns the choice, so a clickable row is an `AkRadio` inside a `<label>`.
 */
function AkRadioGroup({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('flex flex-col', className)}
      {...props}
    />
  );
}

type AkRadioProps = ComponentProps<typeof RadioGroupPrimitive.Item> &
  VariantProps<typeof akRadioVariants>;

/** One option of an `AkRadioGroup`, named by the `<label>` around it or by `aria-label`. */
function AkRadio({ className, color, ...props }: AkRadioProps) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio"
      className={cn('group/radio', akRadioVariants({ color }), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator data-slot="radio-indicator">
        <span className={akRadioDotVariants({ color })} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { AkRadioGroup, AkRadio };
