import { useId, useMemo } from 'react';
import { Controller, FormProvider } from 'react-hook-form';
import { Slot } from 'radix-ui';
import type { Label as LabelPrimitive } from 'radix-ui';
import { type ControllerProps, type FieldPath, type FieldValues } from 'react-hook-form';

import { cn } from '@irene/ui/cn';
import { AkLabel } from '@irene/ui/ak-label';
import { FormFieldContext, FormItemContext, useAkFormField } from '@irene/ui/ak-form/context';

const AkForm = FormProvider;

/** Binds one form value to the controls nested inside it. */
const AkFormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  const field = useMemo(() => ({ name: props.name }), [props.name]);

  return (
    <FormFieldContext.Provider value={field}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

/** Groups a label, control, description and message under one generated id. */
function AkFormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = useId();
  const itemId = useMemo(() => ({ id }), [id]);

  return (
    <FormItemContext.Provider value={itemId}>
      <div data-slot="form-item" className={cn('grid gap-2', className)} {...props} />
    </FormItemContext.Provider>
  );
}

function AkFormLabel({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useAkFormField();

  return (
    <AkLabel
      data-slot="form-label"
      data-error={!!error}
      className={cn('data-[error=true]:text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

/**
 * Wraps the control itself, handing it the ids and the invalid state so a
 * screen reader announces the error alongside the field.
 */
function AkFormControl({ ...props }: React.ComponentProps<typeof Slot.Root>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useAkFormField();

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
      aria-invalid={!!error}
      {...props}
    />
  );
}

function AkFormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const { formDescriptionId } = useAkFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

/**
 * Renders the field's validation error.
 *
 * The element stays in the tree even when the field is valid, so a screen
 * reader has a live region to announce into — an error inserted as a brand new
 * node often goes unread. `empty:hidden` keeps the empty state from taking up
 * space, and the id stays stable for the control's aria-describedby.
 */
function AkFormMessage({ className, children, ...props }: React.ComponentProps<'p'>) {
  const { error, formMessageId } = useAkFormField();
  const body = error ? String(error.message ?? '') : children;

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      aria-live="polite"
      className={cn('text-sm text-destructive empty:hidden', className)}
      {...props}
    >
      {body}
    </p>
  );
}

export {
  AkForm,
  AkFormControl,
  AkFormDescription,
  AkFormField,
  AkFormItem,
  AkFormLabel,
  AkFormMessage,
};
