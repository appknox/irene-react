import { Slot, type Label as LabelPrimitive } from 'radix-ui';
import { useId, useMemo, type ComponentProps, type ReactNode } from 'react';
import { FormProvider, useController, type FieldPath, type FieldValues } from 'react-hook-form';

import { FormFieldContext, FormItemContext, useAkFormField } from '@irene/ui/ak-form/context';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkLabel } from '@irene/ui/ak-label';
import { cn } from '@irene/ui/cn';

/** Supplies the form to everything nested inside it. Renders nothing itself. */
const AkFormProvider = FormProvider;

/** Groups a label, control, description and message under one generated id. */
function AkFormItem({ className, ...props }: ComponentProps<'div'>) {
  const id = useId();
  const itemId = useMemo(() => ({ id }), [id]);

  return (
    <FormItemContext.Provider value={itemId}>
      <div data-slot="form-item" className={cn('grid gap-1.5', className)} {...props} />
    </FormItemContext.Provider>
  );
}

function AkFormLabel({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useAkFormField();

  return (
    <AkLabel
      data-slot="form-label"
      // The message below the field carries the error; the label stays neutral.
      data-error={!!error}
      className={className}
      htmlFor={formItemId}
      {...props}
    />
  );
}

/**
 * Wraps the control itself, handing it the ids and the invalid state so a
 * screen reader announces the error alongside the field.
 */
function AkFormControl({ ...props }: ComponentProps<typeof Slot.Root>) {
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

function AkFormDescription({ className, ...props }: ComponentProps<'p'>) {
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
function AkFormMessage({ className, children, ...props }: ComponentProps<'p'>) {
  const { error, formMessageId } = useAkFormField();
  const body = error ? String(error.message ?? '') : children;

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      aria-live="polite"
      className={cn('flex items-start gap-1 text-sm text-destructive empty:hidden', className)}
      {...props}
    >
      {/* Marks the message as a complaint, the same way a field's own error does. */}
      {error && <AkIcon name="material-symbols:cancel" className="mt-0.5 size-3.5 shrink-0" />}

      {body}
    </p>
  );
}

export type AkFormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Omit<ComponentProps<'div'>, 'children'> & {
  name: TName;
  children: ReactNode;
  label?: ReactNode;
  labelAction?: ReactNode;
  description?: ReactNode;
};

/**
 * Binds one form value to the control nested inside it, and renders its label,
 * description and error message.
 *
 * The control is a child, not a render prop, so a field reads as markup:
 * `<AkFormField name="password" label="Password"><AkInput type="password" /></AkFormField>`.
 * Value, change and blur reach the child through the control slot, so any
 * component that spreads props onto an input works.
 *
 * @param props.name - The form value to bind.
 * @param props.children - The control.
 * @param props.label - The field's label.
 * @param props.labelAction - Rendered opposite the label.
 * @param props.description - Help text under the control.
 */
function AkFormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  name,
  children,
  label,
  labelAction,
  description,
  ...props
}: AkFormFieldProps<TFieldValues, TName>) {
  const fieldContext = useMemo(() => ({ name }), [name]);
  const { field } = useController<TFieldValues, TName>({ name });

  return (
    <FormFieldContext.Provider value={fieldContext}>
      <AkFormItem {...props}>
        {(label || labelAction) && (
          <div className="flex items-center justify-between gap-2">
            <AkFormLabel className="text-md font-medium">{label}</AkFormLabel>
            {labelAction}
          </div>
        )}

        <AkFormControl {...field}>{children}</AkFormControl>

        {description && <AkFormDescription>{description}</AkFormDescription>}

        <AkFormMessage />
      </AkFormItem>
    </FormFieldContext.Provider>
  );
}

export {
  AkFormProvider,
  AkFormControl,
  AkFormDescription,
  AkFormField,
  AkFormItem,
  AkFormLabel,
  AkFormMessage,
};
