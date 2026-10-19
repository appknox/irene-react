import { type ReactNode } from 'react';
import { AkTypography } from '@irene/ui/ak-typography';

interface StepProps {
  number: number;
  title: string;
  children?: ReactNode;
}

/**
 * One numbered step of registering a device.
 *
 * @param props.number - Where it falls in the sequence.
 * @param props.title - What to do.
 * @param props.children - Anything the step needs beyond its title: links, notes, a value to copy.
 */
export function CYODSetupStep({ number, title, children }: Readonly<StepProps>) {
  return (
    <li className="flex w-full items-start gap-3.5" data-test-cyod-step={number}>
      <span
        aria-hidden="true"
        className="
          flex size-5.5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm
          leading-none font-semibold text-primary-strong
        "
      >
        {number}
      </span>

      <div className="flex w-full flex-col gap-2.5">
        <AkTypography fontWeight="medium">{title}</AkTypography>

        {children}
      </div>
    </li>
  );
}
