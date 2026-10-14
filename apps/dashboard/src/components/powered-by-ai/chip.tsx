import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';

interface PoweredByAiChipProps {
  variant?: 'filled' | 'outlined';
  clickable?: boolean;
  className?: string;
}

/**
 * The mark on anything an AI produced.
 *
 * It states where the output came from, so a reader can weigh it before acting
 * on it. It carries no behaviour of its own: a chip that opens the drawer is
 * one of these inside the control that opens it, marked clickable so it
 * answers the pointer.
 *
 * @param props.variant - Filled on a plain surface, outlined on a tinted one.
 * @param props.clickable - Whether it sits inside a control, which it then reacts with.
 * @param props.className - Laid out by whatever holds it.
 */
export function PoweredByAiChip({
  variant = 'filled',
  clickable = false,
  className,
}: Readonly<PoweredByAiChipProps>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.25 rounded-sm border px-1.5 py-1 whitespace-nowrap',
        variant === 'filled'
          ? 'border-ai bg-ai text-ai-foreground'
          : 'border-ai bg-transparent text-ai',
        clickable && 'cursor-pointer hover:border-ai-hover',
        className
      )}
      data-test-powered-by-ai-chip
    >
      <AkIcon name="material-symbols:network-intel-node" className="size-4" />

      <AkTypography tag="span" variant="body2" color="inherit">
        <AkMessageTranslate id="poweredByAi" />
      </AkTypography>
    </span>
  );
}
