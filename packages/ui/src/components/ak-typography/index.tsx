import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps, type ElementType } from 'react';

import { akTypographyVariants } from '@irene/ui/ak-typography/variants';
import { cn } from '@irene/ui/cn';

/** Which element each variant renders as, unless `tag` says otherwise. */
const VARIANT_TAGS: Record<TypographyVariant, ElementType> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  subtitle1: 'h6',
  subtitle2: 'h6',
  body1: 'p',
  body2: 'p',
  body3: 'p',
};

/** Types for the `AkTypography` component. */
type AkTypographyVariants = VariantProps<typeof akTypographyVariants>;
type TypographyVariant = NonNullable<AkTypographyVariants['variant']>;

type AkTypographyProps = ComponentProps<'p'> &
  Omit<AkTypographyVariants, 'variant'> & {
    variant?: TypographyVariant;
    tag?: ElementType;
  };

/**
 * Text at one of the design system's sizes.
 *
 * The variant fixes the size, weight and element together, so a heading reads
 * as a heading to a screen reader without the caller thinking about it. Every
 * part of that is overridable: `fontWeight` and `color` on their own, `tag` for
 * the element, and `className` for anything else.
 *
 * @param props.variant - Which step of the type scale to use.
 * @param props.color - Which palette colour the text takes.
 * @param props.fontWeight - Overrides the weight the variant sets.
 * @param props.align - Text alignment.
 * @param props.underline - Whether the text is underlined, always or on hover.
 * @param props.noWrap - Clips to one line with an ellipsis.
 * @param props.breakWord - Lets a long unbroken string wrap.
 * @param props.gutterBottom - Adds space below, for stacked text.
 * @param props.tag - Renders a different element than the variant implies.
 */
function AkTypography({
  className,
  variant = 'body1',
  color,
  fontWeight,
  align,
  underline,
  noWrap,
  breakWord,
  gutterBottom,
  tag,
  ...props
}: AkTypographyProps) {
  const Tag = tag ?? VARIANT_TAGS[variant];

  return (
    <Tag
      data-slot="typography"
      className={cn(
        akTypographyVariants({
          variant,
          color,
          fontWeight,
          align,
          underline,
          noWrap,
          breakWord,
          gutterBottom,
        }),
        className
      )}
      {...props}
    />
  );
}

export { AkTypography };
