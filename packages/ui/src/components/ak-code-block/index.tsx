import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { cn } from '@irene/ui/cn';

import { akCodeBlockCopyVariants, akCodeBlockVariants } from './variants';

type AkCodeBlockProps = Omit<ComponentProps<'div'>, 'children' | 'onCopy'> &
  VariantProps<typeof akCodeBlockVariants> & {
    code: string;
    copyLabel?: string;
    onCopy?: (code: string) => void;
  };

/**
 * A command or file shown as it is to be pasted, with a button that copies it.
 *
 * A long line scrolls inside the block rather than wrapping, since a wrapped
 * command reads as two. The copy button sits beside the text, not over it, so
 * nothing scrolls under it.
 *
 * The block does not touch the clipboard: the caller copies the code it is
 * handed, so the app's one copy path decides what a copy or a refusal tells
 * the user.
 *
 * @param props.code - The text, as it is to be pasted.
 * @param props.variant - light for a tinted panel, dark for white text on black.
 * @param props.copyLabel - Names the copy button.
 * @param props.onCopy - Copies the code it is handed; the button shows only with it and `copyLabel`.
 */
function AkCodeBlock({ code, variant, copyLabel, onCopy, className, ...props }: AkCodeBlockProps) {
  return (
    <div
      data-slot="code-block"
      data-variant={variant ?? 'light'}
      className={cn(akCodeBlockVariants({ variant }), className)}
      {...props}
    >
      <pre className="min-w-0 flex-1 overflow-x-auto py-3.5 pl-3.5 font-mono text-sm whitespace-pre">
        <code>{code}</code>
      </pre>

      {copyLabel && onCopy && (
        <AkIconButton
          size="small"
          aria-label={copyLabel}
          className={akCodeBlockCopyVariants({ variant })}
          onClick={() => onCopy(code)}
        >
          <AkIcon name="material-symbols:content-copy-outline" />
        </AkIconButton>
      )}
    </div>
  );
}

export { AkCodeBlock };
