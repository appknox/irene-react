import { type ComponentProps, type ReactNode } from 'react';

import { AkIcon } from '@irene/ui/ak-icon';
import { cn } from '@irene/ui/cn';

type AkTextareaProps = ComponentProps<'textarea'> & {
  hasError?: boolean;
  errorMessage?: ReactNode;
  wrapperClassName?: string;
};

/**
 * A field for several lines of text, with its error message underneath.
 *
 * It is the text field's sibling: the same border, radius and error treatment,
 * with the padding a block of text needs rather than a single line's height.
 *
 * @param props.hasError - Colours the border without showing a message.
 * @param props.errorMessage - The message under the field.
 * @param props.wrapperClassName - Classes for the wrapper.
 */
function AkTextarea({
  className,
  wrapperClassName,
  hasError,
  errorMessage,
  'aria-invalid': ariaInvalid,
  ...props
}: AkTextareaProps) {
  const invalid = hasError || Boolean(errorMessage) || ariaInvalid;

  return (
    <div className={cn('grid w-full gap-1', wrapperClassName)}>
      <textarea
        data-slot="textarea"
        aria-invalid={invalid}
        className={cn(
          'w-full max-w-full rounded-sm border border-input bg-transparent p-2.75 text-base',
          'shadow-xs transition-[color,box-shadow] outline-none',
          'selection:bg-primary selection:text-primary-foreground',
          'placeholder:text-base placeholder:text-muted-foreground',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-neutral-100',
          'disabled:bg-neutral-100 disabled:text-foreground',
          'dark:bg-input/30',
          `
            focus-visible:border-border-strong focus-visible:ring-[3px]
            focus-visible:ring-border-strong/40
          `,
          'aria-invalid:border-danger aria-invalid:ring-danger/20',
          className
        )}
        {...props}
      />

      {errorMessage && (
        <p className="flex items-start gap-1 text-sm text-danger" data-slot="textarea-error">
          <AkIcon name="material-symbols:cancel" className="mt-0.5 size-3.5 shrink-0" />
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export { AkTextarea };
