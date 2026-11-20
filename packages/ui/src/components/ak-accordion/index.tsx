import { Accordion as AccordionPrimitive } from 'radix-ui';
import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps, type ReactNode } from 'react';

import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

import { akAccordionTriggerVariants } from './variants';

type AkAccordionProps = Omit<
  ComponentProps<typeof AccordionPrimitive.Root>,
  'type' | 'value' | 'defaultValue' | 'onValueChange' | 'collapsible'
> &
  VariantProps<typeof akAccordionTriggerVariants> & {
    summaryText: ReactNode;
    children: ReactNode;
    isExpanded?: boolean;
    defaultExpanded?: boolean;
    onExpandedChange?: (isExpanded: boolean) => void;
    disabled?: boolean;
    summaryClassName?: string;
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  };

/* The value of the single item, so Radix can tell it open from shut. */
const SECTION = 'section';

/**
 * A single section that opens and shuts under its summary row; irene's accordions
 * are never grouped, so it holds one Radix item.
 *
 * @param props.isExpanded - Controls the state; leave it undefined to use `defaultExpanded`.
 * @param props.headingLevel - The heading wrapping the summary row, so it sits in the page outline.
 */
function AkAccordion({
  summaryText,
  children,
  isExpanded,
  defaultExpanded = false,
  onExpandedChange,
  variant,
  disabled = false,
  summaryClassName,
  headingLevel = 3,
  className,
  ...props
}: Readonly<AkAccordionProps>) {
  const controlled = isExpanded === undefined ? {} : { value: isExpanded ? SECTION : '' };
  const Heading = `h${headingLevel}` as const;

  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      type="single"
      collapsible
      disabled={disabled}
      defaultValue={defaultExpanded ? SECTION : undefined}
      onValueChange={(value) => onExpandedChange?.(value === SECTION)}
      className={cn('flex w-full flex-col', className)}
      {...controlled}
      {...props}
    >
      <AccordionPrimitive.Item value={SECTION}>
        <AccordionPrimitive.Header asChild>
          <Heading>
            <AccordionPrimitive.Trigger
              data-slot="accordion-trigger"
              className={cn(akAccordionTriggerVariants({ variant }), summaryClassName)}
            >
              <AkTypography tag="span" variant="subtitle1">
                {summaryText}
              </AkTypography>

              <AkIcon
                name="material-symbols:arrow-drop-down"
                className="size-6 transition-transform group-data-[state=open]/accordion:rotate-180"
              />
            </AccordionPrimitive.Trigger>
          </Heading>
        </AccordionPrimitive.Header>

        <AccordionPrimitive.Content data-slot="accordion-content" className="w-full">
          {children}
        </AccordionPrimitive.Content>
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  );
}

export { AkAccordion };
