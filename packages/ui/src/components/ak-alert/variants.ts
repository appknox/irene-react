import { cva } from 'class-variance-authority';

/*
  The same colours as AkButton, on a tinted surface. Used inline on a page and,
  through `akNotify`, as the body of a toast.
*/
export const akAlertVariants = cva(
  'relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-sm border px-4 py-3 text-sm has-[>svg]:grid-cols-[--spacing(4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5',
  {
    variants: {
      variant: {
        default: 'border-border bg-background text-foreground',
        error: 'border-danger-subtle bg-danger-surface text-danger',
        warning: 'border-warning bg-warning-surface text-warning-strong',
        success: 'border-success bg-success-surface text-success',
        info: 'border-info bg-info-surface text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
