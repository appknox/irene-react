import { Fragment, type ReactNode } from 'react';

import { AkDivider } from '@irene/ui/ak-divider';
import { AkTypography } from '@irene/ui/ak-typography';

/** One labelled value in a details section. */
export interface DetailsInfoRow {
  id: string;
  title: ReactNode;
  value: ReactNode;
}

/** A details section's labelled values, ruled apart; an empty value reads "-". */
export function DetailsInfoRows({ rows }: Readonly<{ rows: DetailsInfoRow[] }>) {
  return (
    <dl className="flex w-full flex-col gap-3">
      {rows.map((row, index) => (
        <Fragment key={row.id}>
          {index > 0 && <AkDivider color="light" />}

          <div className="flex w-9/12 items-center gap-5" data-test-sk-info-row={row.id}>
            <dt className="w-37.5 shrink-0">
              <AkTypography tag="span" color="neutral">
                {row.title}
              </AkTypography>
            </dt>

            <dd>
              <AkTypography tag="span" fontWeight="medium">
                {row.value || '-'}
              </AkTypography>
            </dd>
          </div>
        </Fragment>
      ))}
    </dl>
  );
}
