import { forwardRef, type ComponentProps } from 'react';

import { AkIcon } from '@irene/ui/ak-icon';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

type SkCheckChipState =
  | 'archived'
  | 'disabled-state'
  | 'needs-action'
  | 'initializing'
  | 'feature-in-progress'
  | 'no-action';

/* irene outlines a hovered chip with a half-pixel inset shadow; an inset ring draws the same. */
const STATE_CLASSES = {
  archived: cn(
    'border-black bg-neutral-200 text-black hover:ring-1 hover:ring-black hover:ring-inset'
  ),
  'disabled-state': cn('border-neutral-200 bg-neutral-200 text-black'),
  'needs-action': cn(
    `
      border-primary bg-primary-surface text-primary
      hover:ring-1 hover:ring-primary hover:ring-inset
    `
  ),
  initializing: cn('border-neutral-600 bg-background text-black hover:shadow-14'),
  'feature-in-progress': cn(
    `
      border-new-feature bg-new-feature-surface text-new-feature
      hover:ring-1 hover:ring-new-feature hover:ring-inset
    `
  ),
  'no-action': cn(
    'border-success bg-success-faint text-success hover:ring-1 hover:ring-success hover:ring-inset'
  ),
} satisfies Record<SkCheckChipState, string>;

/* irene stacks classes and lets CSS precedence decide; this picks the same winner. */
function _checkChipState(flags: {
  readOnly: boolean;
  showDisabledState: boolean;
  needsAction: boolean;
  statusIsInitializing: boolean;
  featureInProgress: boolean;
}): SkCheckChipState {
  if (flags.readOnly && !flags.featureInProgress) {
    return 'archived';
  }

  if (flags.showDisabledState && !flags.featureInProgress) {
    return 'disabled-state';
  }

  if (flags.needsAction) {
    return 'needs-action';
  }

  if (flags.statusIsInitializing) {
    return 'initializing';
  }

  return flags.featureInProgress ? 'feature-in-progress' : 'no-action';
}

interface SkCheckChipProps extends Omit<ComponentProps<'span'>, 'ref'> {
  label: string;
  needsAction?: boolean;
  featureInProgress?: boolean;
  statusIsInitializing?: boolean;
  disabled?: boolean;
  hideRightIcon?: boolean;
  showDisabledState?: boolean;
  readOnly?: boolean;
}

/**
 * One of the app's checks, drawn as a chip; a span, since it is the face of a link.
 *
 * @param props.featureInProgress - A feature the organization has not bought.
 * @param props.disabled - Only changes the cursor; irene's colours stay.
 * @param props.showDisabledState - Monitoring is off and the results are past.
 */
export const SkCheckChip = forwardRef<HTMLSpanElement, SkCheckChipProps>(function SkCheckChip(
  {
    label,
    needsAction = false,
    featureInProgress = false,
    statusIsInitializing = false,
    disabled = false,
    hideRightIcon = false,
    showDisabledState = false,
    readOnly = false,
    className,
    ...props
  },
  ref
) {
  const leftIcon =
    showDisabledState && !featureInProgress ? 'material-symbols:history' : 'material-symbols:info';

  const showsSpinner = statusIsInitializing && !showDisabledState;

  const state = _checkChipState({
    readOnly,
    showDisabledState,
    needsAction,
    statusIsInitializing,
    featureInProgress,
  });

  return (
    <span
      ref={ref}
      data-needs-action={needsAction || undefined}
      data-feature-in-progress={featureInProgress || undefined}
      data-disabled={disabled || undefined}
      data-state={state}
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-xs border px-3',
        STATE_CLASSES[state],
        disabled && 'cursor-not-allowed hover:ring-0',
        className
      )}
      {...props}
    >
      <AkIcon name={leftIcon} className="size-4" />

      <AkTypography tag="span" color="inherit" fontWeight="medium">
        {label}
      </AkTypography>

      {!hideRightIcon &&
        (showsSpinner ? (
          <AkSpinner className="size-4" data-test-sk-action-loading />
        ) : (
          <AkIcon name="material-symbols:arrow-outward" className="size-4 text-foreground" />
        ))}
    </span>
  );
});
