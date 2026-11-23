import type { ReactNode } from 'react';

import { AkTypography } from '@irene/ui/ak-typography';
import ProjectListEmpty from '@irene/ui/svgs/project-list-empty.svg?react';

interface SkListEmptyProps {
  header: ReactNode;
  subText?: ReactNode;
  illustration?: ReactNode;
}

/** What an inventory list shows when it has no rows. */
export function SkListEmpty({ header, subText, illustration }: Readonly<SkListEmptyProps>) {
  return (
    <div
      className="flex w-full flex-col items-center bg-background px-6 py-12"
      data-test-sk-list-empty
    >
      {illustration ?? <ProjectListEmpty aria-hidden="true" />}

      <AkTypography variant="h5" gutterBottom className="mt-6">
        {header}
      </AkTypography>

      {subText && (
        <AkTypography align="center" className="max-w-125">
          {subText}
        </AkTypography>
      )}
    </div>
  );
}
