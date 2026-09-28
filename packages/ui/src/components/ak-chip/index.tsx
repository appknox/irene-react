import { Fragment, type ComponentProps, type MouseEvent, type ReactNode } from 'react';
import { type VariantProps } from 'class-variance-authority';

import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

import { akChipVariants } from './variants';

// Constant for the label size based on the chip size.
const LABEL_SIZE = { small: cn('text-sm'), medium: cn('text-base') };

type AkChipProps = Omit<ComponentProps<'div'>, 'children' | 'color' | 'onClick'> &
  VariantProps<typeof akChipVariants> & {
    label: ReactNode;
    icon?: ReactNode;
    deleteIcon?: ReactNode;
    onDelete?: (event: MouseEvent<HTMLButtonElement>) => void;
    onClick?: NonNullable<ComponentProps<'button'>['onClick']>;
    labelVariant?: NonNullable<ComponentProps<typeof AkTypography>['variant']>;
    labelClassName?: string;
    labelColor?: NonNullable<ComponentProps<typeof AkTypography>['color']>;
    fontWeight?: NonNullable<ComponentProps<typeof AkTypography>['fontWeight']>;
  };

/**
 * A short, static label: a count beside a navigation item, a state on a row.
 *
 * It carries no behaviour of its own unless it is given some. `button` marks it
 * as a control for a screen reader; `onDelete` adds a dismiss control, which
 * stops the click reaching the chip so dismissing one never also opens it.
 *
 * @param props.label - What it reads.
 * @param props.icon - Rendered before the label.
 * @param props.deleteIcon - Replaces the close mark on the dismiss control.
 * @param props.onDelete - Adds a dismiss control and is called when it is pressed.
 * @param props.labelVariant - Which step of the type scale the label takes, over the chip's size.
 * @param props.labelClassName - Classes for the label.
 * @param props.labelColor - The label's colour. Inherits the chip's by default.
 * @param props.fontWeight - The label's weight.
 * @param props.variant - Outlined by default; filled, tinted, or tinted with an outline.
 * @param props.color - Which of the palette's meanings it carries.
 * @param props.size - Its height and type scale.
 * @param props.button - Marks a chip that acts on a click as a control.
 */
function AkChip({
  label,
  icon,
  deleteIcon,
  onDelete,
  labelVariant,
  labelClassName,
  labelColor = 'inherit',
  fontWeight = 'regular',
  variant,
  color,
  size,
  button,
  className,
  onClick,
  ...props
}: AkChipProps) {
  /* Stopped here so dismissing a chip does not also trigger the chip itself. */
  const dismiss = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete?.(event);
  };

  return (
    <div
      data-slot="chip"
      className={cn(akChipVariants({ variant, color, size, button }), className)}
      {...props}
    >
      <AkChipContent button={button} onClick={onClick}>
        {icon && (
          <span data-slot="chip-icon" className="ml-1.75 inline-flex items-center">
            {icon}
          </span>
        )}

        <AkTypography
          tag="span"
          variant={labelVariant}
          color={labelColor}
          fontWeight={fontWeight}
          className={cn(
            'mr-1.75 truncate',
            !labelVariant && LABEL_SIZE[size ?? 'medium'],
            icon ? 'ml-0.5' : 'ml-1.75',
            labelClassName
          )}
        >
          {label}
        </AkTypography>
      </AkChipContent>

      {onDelete && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Remove"
          data-slot="chip-delete"
          className={cn(
            'mr-1.75 inline-flex cursor-pointer items-center rounded-xs p-0.5 text-inherit',
            'transition-colors hover:bg-current/10'
          )}
        >
          {deleteIcon ?? <AkIcon name="material-symbols:close" className="size-full" />}
        </button>
      )}
    </div>
  );
}

interface AkChipContentProps {
  button?: boolean | null;
  onClick?: NonNullable<ComponentProps<'button'>['onClick']>;
  children: ReactNode;
}

/**
 * The chip's icon and label, as a control when the chip acts on a click.
 *
 * @param props.button - Whether the chip acts on a click.
 * @param props.onClick - What it does.
 * @param props.children - The icon and the label.
 */
function AkChipContent({ button, onClick, children }: Readonly<AkChipContentProps>) {
  return (
    <Fragment>
      {button ? (
        <button
          type="button"
          onClick={onClick}
          data-slot="chip-button"
          className="inline-flex h-full cursor-pointer items-center text-inherit"
        >
          {children}
        </button>
      ) : (
        children
      )}
    </Fragment>
  );
}

export { AkChip };
