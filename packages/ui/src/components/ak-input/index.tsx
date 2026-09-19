import { type ComponentProps, type ReactNode } from 'react';

import { AkIcon } from '@irene/ui/ak-icon';
import { cn } from '@irene/ui/cn';

type AkInputProps = ComponentProps<'input'> & {
  hasError?: boolean;
  errorMessage?: ReactNode;
  wrapperClassName?: string;
};

/**
 * A text field, with its error message underneath when it has one.
 *
 * @param props.hasError - Colours the border without showing a message.
 * @param props.errorMessage - The message under the field.
 * @param props.wrapperClassName - Classes for the wrapper.
 */
function AkInput({
  className,
  wrapperClassName,
  type,
  hasError,
  errorMessage,
  'aria-invalid': ariaInvalid,
  ...props
}: AkInputProps) {
  // Keeps an explicit false from the form control, which a screen reader reads as valid.
  const invalid = hasError || Boolean(errorMessage) || ariaInvalid;

  return (
    <div className={cn('grid w-full gap-1', wrapperClassName)}>
      <input
        type={type}
        data-slot="input"
        aria-invalid={invalid}
        className={cn(
          'h-9 w-full min-w-0 rounded-sm border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-base placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30',
          'focus-visible:border-border-strong focus-visible:ring-[3px] focus-visible:ring-border-strong/40',
          'aria-invalid:border-danger aria-invalid:ring-danger/20',
          className
        )}
        {...props}
      />

      {errorMessage && (
        <p className="flex items-start gap-1 text-sm text-danger" data-slot="input-error">
          <AkIcon name="material-symbols:cancel" className="mt-0.5 size-3.5 shrink-0" />
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export { AkInput };
