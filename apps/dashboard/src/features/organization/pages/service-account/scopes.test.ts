import { describe, expect, it } from 'vitest';

import {
  applyScopeChange,
  isNodeChecked,
  isNodePartlyChecked,
  NO_SCOPES,
  SCOPE_TREE,
  type ScopeNode,
} from './scopes';

/** Finds a row of the tree by its key, at any depth. */
const nodeFor = (key: string): ScopeNode => {
  const search = (nodes: ScopeNode[]): ScopeNode | undefined => {
    for (const node of nodes) {
      if (node.key === key) {
        return node;
      }

      const found = node.children && search(node.children);

      if (found) {
        return found;
      }
    }

    return undefined;
  };

  const node = search(SCOPE_TREE);

  expect(node).toBeDefined();

  return node as ScopeNode;
};

describe('reading a row of the scope tree', () => {
  it('reads a group as granted only once every scope under it is', () => {
    const publicApi = nodeFor('public-api');

    const everyScope = publicApi.scopeKeys.reduce(
      (granted, key) => ({ ...granted, [key]: true }),
      NO_SCOPES
    );

    expect(isNodeChecked(publicApi, everyScope)).toBe(true);
    expect(isNodeChecked(publicApi, NO_SCOPES)).toBe(false);
  });

  it('reads a group as part-granted while only some of it is', () => {
    const scopes = { ...NO_SCOPES, scope_public_api_project_read: true };

    expect(isNodePartlyChecked(nodeFor('public-api'), scopes)).toBe(true);
    expect(isNodeChecked(nodeFor('public-api'), scopes)).toBe(false);
  });
});

describe('granting a row of the scope tree', () => {
  it('carries a group down to every scope beneath it', () => {
    const granted = applyScopeChange(NO_SCOPES, nodeFor('user'), true);

    expect(granted.scope_public_api_user_read).toBe(true);
    expect(granted.scope_public_api_user_write).toBe(true);
    expect(granted.scope_public_api_project_read).toBe(false);
  });

  it('withdraws every scope under a group with it', () => {
    const granted = applyScopeChange(NO_SCOPES, nodeFor('user'), true);
    const withdrawn = applyScopeChange(granted, nodeFor('user'), false);

    expect(withdrawn.scope_public_api_user_read).toBe(false);
    expect(withdrawn.scope_public_api_user_write).toBe(false);
  });

  it('grants the upload access that an approval of new namespaces needs', () => {
    const granted = applyScopeChange(NO_SCOPES, nodeFor('auto-approve-new-name-spaces'), true);

    expect(granted.scope_auto_approve_new_name_spaces).toBe(true);
    expect(granted.scope_public_api_upload_app).toBe(true);
  });

  it('withdraws that approval when the upload access goes', () => {
    const granted = applyScopeChange(NO_SCOPES, nodeFor('auto-approve-new-name-spaces'), true);
    const withdrawn = applyScopeChange(granted, nodeFor('upload-app'), false);

    expect(withdrawn.scope_public_api_upload_app).toBe(false);
    expect(withdrawn.scope_auto_approve_new_name_spaces).toBe(false);
  });

  it('grants the command line itself when its approval is granted', () => {
    const granted = applyScopeChange(NO_SCOPES, nodeFor('cli-auto-approve-new-name-spaces'), true);

    expect(granted.cli_scope_auto_approve_new_name_spaces).toBe(true);
    expect(granted.scope_cli).toBe(true);
  });

  it('withdraws that approval when the command line goes', () => {
    const granted = applyScopeChange(NO_SCOPES, nodeFor('cli'), true);
    const withdrawn = applyScopeChange(granted, nodeFor('cli'), false);

    expect(withdrawn.scope_cli).toBe(false);
    expect(withdrawn.cli_scope_auto_approve_new_name_spaces).toBe(false);
  });

  it('leaves the other scopes alone', () => {
    const scopes = { ...NO_SCOPES, scope_public_api_team_operations: true };
    const granted = applyScopeChange(scopes, nodeFor('projects-read'), true);

    expect(granted.scope_public_api_team_operations).toBe(true);
    expect(granted.scope_public_api_project_read).toBe(true);
  });
});
