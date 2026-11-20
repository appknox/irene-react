import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import type { Signal } from '@/features/storeknox/utils/fake-app-signals';

const RESULT_COLOR = {
  high: cn('text-severity-critical'),
  medium: cn('text-severity-high'),
  low: cn('text-severity-passed'),
} satisfies Record<Signal['level'], string>;

/**
 * A signal's result label, coloured by how strongly the rule fired. The signal row and the
 * signal drawer both show it, so it stays one component.
 *
 * @param props.signal - The signal whose result label and level are drawn.
 */
export function SignalResult({
  signal,
}: Readonly<{ signal: Pick<Signal, 'level' | 'resultLabel'> }>) {
  return (
    <AkTypography
      tag="span"
      fontWeight="bold"
      color="inherit"
      className={cn(RESULT_COLOR[signal.level])}
      data-test-sk-signal-result={signal.level}
    >
      {signal.resultLabel}
    </AkTypography>
  );
}
