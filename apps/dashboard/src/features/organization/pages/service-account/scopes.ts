import type { ApiServiceAccountScopes } from '@irene/api/services/service-account';
import { akMT } from '@irene/translations/intl';

/** Every scope flag off, which is what a new account starts from. */
export const NO_SCOPES: ApiServiceAccountScopes = {
  scope_public_api_user_read: false,
  scope_public_api_user_write: false,
  scope_public_api_project_read: false,
  scope_public_api_scan_result_va: false,
  scope_public_api_upload_app: false,
  scope_public_api_team_operations: false,
  scope_public_api_store_release_readiness: false,
  scope_auto_approve_new_name_spaces: false,
  scope_cli: false,
  cli_scope_auto_approve_new_name_spaces: false,
};

/** One row of the scope tree: a group that only holds rows, or a scope that can be granted. */
export interface ScopeNode {
  key: string;

  /** A group names itself; a scope names what it covers and what access it gives. */
  label?: () => string;
  scopeLabel?: () => string;
  accessType?: () => string;
  description?: () => string;

  /** The flags this row grants. A group carries every flag beneath it. */
  scopeKeys: (keyof ApiServiceAccountScopes)[];
  children?: ScopeNode[];
}

/**
 * The scopes a service account may be given, as irene's tree arranges them.
 *
 * The public API's scopes sit under one root, with the user and upload pairs
 * grouped inside it; the command line is a root of its own, with the namespace
 * approval it may be trusted with beneath it.
 */
export const SCOPE_TREE: ScopeNode[] = [
  {
    key: 'public-api',
    label: () => akMT('serviceAccountModule.scopes.public-api.label'),

    scopeKeys: [
      'scope_public_api_project_read',
      'scope_public_api_scan_result_va',
      'scope_public_api_user_read',
      'scope_public_api_user_write',
      'scope_public_api_upload_app',
      'scope_public_api_team_operations',
      'scope_public_api_store_release_readiness',
      'scope_auto_approve_new_name_spaces',
    ],

    children: [
      {
        key: 'projects-read',
        scopeKeys: ['scope_public_api_project_read'],
        scopeLabel: () => akMT('serviceAccountModule.scopes.projects.label'),
        description: () => akMT('serviceAccountModule.scopes.projects.readDescription'),
        accessType: () => akMT('read'),
      },
      {
        key: 'scan-results-va-read',
        scopeKeys: ['scope_public_api_scan_result_va'],
        scopeLabel: () => akMT('serviceAccountModule.scopes.scan-results-va.label'),
        description: () => akMT('serviceAccountModule.scopes.scan-results-va.readDescription'),
        accessType: () => akMT('read'),
      },
      {
        key: 'user',
        label: () => akMT('serviceAccountModule.scopes.user.label'),
        scopeKeys: ['scope_public_api_user_read', 'scope_public_api_user_write'],

        children: [
          {
            key: 'user-read',
            scopeKeys: ['scope_public_api_user_read'],
            scopeLabel: () => akMT('serviceAccountModule.scopes.user.read'),
            description: () => akMT('serviceAccountModule.scopes.user.readDescription'),
            accessType: () => akMT('read'),
          },
          {
            key: 'user-write',
            scopeKeys: ['scope_public_api_user_write'],
            scopeLabel: () => akMT('serviceAccountModule.scopes.user.write'),
            description: () => akMT('serviceAccountModule.scopes.user.writeDescription'),
            accessType: () => akMT('write'),
          },
        ],
      },
      {
        key: 'upload',
        label: () => akMT('serviceAccountModule.scopes.upload-app.label'),
        scopeKeys: ['scope_public_api_upload_app', 'scope_auto_approve_new_name_spaces'],

        children: [
          {
            key: 'upload-app',
            scopeKeys: ['scope_public_api_upload_app'],
            scopeLabel: () => akMT('serviceAccountModule.scopes.upload-app.label'),
            description: () => akMT('serviceAccountModule.scopes.upload-app.writeDescription'),
            accessType: () => akMT('write'),
          },
          {
            key: 'auto-approve-new-name-spaces',
            scopeKeys: ['scope_auto_approve_new_name_spaces'],

            scopeLabel: () =>
              akMT('serviceAccountModule.scopes.auto-approve-new-name-spaces.label'),

            description: () =>
              akMT('serviceAccountModule.scopes.auto-approve-new-name-spaces.writeDescription'),

            accessType: () => akMT('write'),
          },
        ],
      },
      {
        key: 'team-operations',
        scopeKeys: ['scope_public_api_team_operations'],
        scopeLabel: () => akMT('serviceAccountModule.scopes.team-operations.label'),
        description: () => akMT('serviceAccountModule.scopes.team-operations.description'),
        accessType: () => `${akMT('read')}, ${akMT('write')}`,
      },
      {
        key: 'store-release-readiness',
        scopeKeys: ['scope_public_api_store_release_readiness'],
        scopeLabel: () => akMT('serviceAccountModule.scopes.store-release-readiness.label'),
        description: () => akMT('serviceAccountModule.scopes.store-release-readiness.description'),
        accessType: () => akMT('read'),
      },
    ],
  },
  {
    key: 'cli',
    scopeKeys: ['scope_cli'],
    scopeLabel: () => akMT('serviceAccountModule.scopes.cli.label'),
    description: () => akMT('serviceAccountModule.scopes.cli.description'),

    children: [
      {
        key: 'cli-auto-approve-new-name-spaces',
        scopeKeys: ['cli_scope_auto_approve_new_name_spaces'],

        scopeLabel: () =>
          akMT('serviceAccountModule.scopes.cli-auto-approve-new-name-spaces.label'),

        description: () =>
          akMT('serviceAccountModule.scopes.cli-auto-approve-new-name-spaces.description'),

        accessType: () => akMT('write'),
      },
    ],
  },
];

/**
 * The scope flags alone, taken off whatever carries them.
 *
 * An account carries its name and its key beside its scopes, and a change to
 * the scopes is written on its own, so only these are sent.
 *
 * @param source - Anything holding the flags, such as the account itself.
 * @returns The ten flags.
 */
export const pickScopes = (source: ApiServiceAccountScopes): ApiServiceAccountScopes =>
  (Object.keys(NO_SCOPES) as (keyof ApiServiceAccountScopes)[]).reduce(
    (flags, key) => ({ ...flags, [key]: source[key] }),
    NO_SCOPES
  );

/** Whether every flag a row grants is on, which is how a group reads as checked. */
export const isNodeChecked = (node: ScopeNode, scopes: ApiServiceAccountScopes) =>
  node.scopeKeys.every((key) => scopes[key]);

/** Whether some but not all of them are, which a group shows as part-granted. */
export const isNodePartlyChecked = (node: ScopeNode, scopes: ApiServiceAccountScopes) =>
  !isNodeChecked(node, scopes) && node.scopeKeys.some((key) => scopes[key]);

/** The flags a row grants, all set to the same state. */
const setScopes = (keys: (keyof ApiServiceAccountScopes)[], isGranted: boolean) =>
  Object.fromEntries(keys.map((key) => [key, isGranted]));

/*
  The three rows that approve namespaces, and the access each one needs.

  Approving a namespace is meaningless without the access it approves for, so
  granting the approval grants that access, and withdrawing the access
  withdraws the approval with it.
*/
const APPROVAL_PAIRS = [
  { access: 'scope_public_api_upload_app', approval: 'scope_auto_approve_new_name_spaces' },
  { access: 'scope_cli', approval: 'cli_scope_auto_approve_new_name_spaces' },
] as const;

/**
 * Grants or withdraws one row of the tree, and whatever follows from it.
 *
 * A group carries its children, since its flags are theirs. Beyond that the
 * namespace approvals follow the access they approve for, in both directions.
 *
 * @param scopes - The scopes as they stand.
 * @param node - The row being granted or withdrawn.
 * @param isGranted - Whether it is being granted.
 * @returns The scopes as they now stand.
 */
export function applyScopeChange(
  scopes: ApiServiceAccountScopes,
  node: ScopeNode,
  isGranted: boolean
): ApiServiceAccountScopes {
  const next: ApiServiceAccountScopes = {
    ...scopes,
    ...setScopes(node.scopeKeys, isGranted),
  };

  for (const { access, approval } of APPROVAL_PAIRS) {
    const touchesAccess = node.scopeKeys.includes(access);
    const touchesApproval = node.scopeKeys.includes(approval);

    if (touchesAccess && !isGranted && !touchesApproval) {
      next[approval] = false;
    }

    if (touchesApproval && isGranted && !touchesAccess) {
      next[access] = true;
    }
  }

  return next;
}
