import { useQuery } from '@tanstack/react-query';

import { akMT, getIntl } from '@irene/translations/intl';
import { AkTable } from '@irene/ui/ak-table';
import { createAkTableColumns } from '@irene/ui/ak-table/helpers';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiPersonalToken } from '@irene/api/services/personal-token';

import { personalTokensOptions } from '@/features/account-settings/queries/personal-token';

import { CopyToken } from './copy-token';
import { RevokeToken } from './revoke-token';

/**
 * The day a token was generated, or nothing when the server's timestamp cannot
 * be read, rather than "Invalid Date".
 *
 * @param created - The ISO 8601 timestamp.
 * @returns The date, formatted for the active locale.
 */
const _formatCreated = (created: string) => {
  const date = new Date(created);

  return Number.isNaN(date.getTime()) ? '' : getIntl().formatDate(date, { format: 'mediumDate' });
};

const tokenColumn = createAkTableColumns<ApiPersonalToken>();

/* Widths are irene's, in pixels, so a long name or key truncates rather than widening the table. */
const TOKEN_COLUMNS = tokenColumn.columns([
  tokenColumn.accessor('name', {
    header: () => akMT('name'),
    meta: { width: '150px' },
    cell: ({ getValue }) => (
      <AkTypography tag="span" title={getValue()} noWrap>
        {getValue()}
      </AkTypography>
    ),
  }),

  tokenColumn.accessor('created', {
    header: () => akMT('created'),
    meta: { width: '120px' },
    cell: ({ getValue }) => (
      <AkTypography tag="span" noWrap>
        {_formatCreated(getValue())}
      </AkTypography>
    ),
  }),

  tokenColumn.accessor('key', {
    header: () => akMT('personalTokenKey'),
    meta: { width: '350px' },
    cell: ({ getValue }) => (
      <AkTypography tag="span" title={getValue()} noWrap className="font-mono text-md">
        {getValue()}
      </AkTypography>
    ),
  }),

  tokenColumn.display({
    id: 'copy',
    header: () => akMT('copy'),
    meta: { align: 'center' },
    cell: ({ row }) => <CopyToken tokenKey={row.original.key} tokenName={row.original.name} />,
  }),

  tokenColumn.display({
    id: 'delete',
    header: () => akMT('delete'),
    meta: { align: 'center' },
    cell: ({ row }) => <RevokeToken token={row.original} />,
  }),
]);

/**
 * The account's API tokens: a form to generate one, and a table of the
 * newest ten with their keys. irene shows no table until there is a token.
 */
export function PersonalTokenList() {
  const { data: tokens = [] } = useQuery(personalTokensOptions());

  if (tokens.length === 0) {
    return null;
  }

  return (
    <AkTable
      columns={TOKEN_COLUMNS}
      data={tokens}
      dense
      borderColor="dark"
      caption={akMT('personalAccessTokens')}
      getRowId={(token) => token.id}
      wrapperClassName="max-w-212.5"
      data-test-personal-token-table
    />
  );
}
