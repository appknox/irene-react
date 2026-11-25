import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import type { ApiServiceAccountScopes } from '@irene/api/services/service-account';

import { applyScopeChange, NO_SCOPES, type ScopeNode } from '../scopes';
import { ScopeTree } from './scope-tree';

/** The tree as the create screen drives it: scopes in state, cascades applied on each change. */
function EditableTree({ initial = NO_SCOPES }: Readonly<{ initial?: ApiServiceAccountScopes }>) {
  const [scopes, setScopes] = useState(initial);

  const change = (node: ScopeNode, isGranted: boolean) =>
    setScopes((current) => applyScopeChange(current, node, isGranted));

  return <ScopeTree scopes={scopes} onChange={change} />;
}

/** One row of the tree, by the key it carries. */
const rowFor = (key: string) =>
  document.querySelector(`[data-test-ak-tree-row="${key}"]`) as HTMLElement;

describe('the scope tree', () => {
  it('opens on the public API, with its own rows under it', () => {
    render(<EditableTree />);

    expect(rowFor('public-api')).not.toBeNull();
    expect(rowFor('projects-read')).not.toBeNull();
    expect(rowFor('cli')).not.toBeNull();

    /* The command line's own row is closed, so its approval is not drawn yet. */
    expect(rowFor('cli-auto-approve-new-name-spaces')).toBeNull();
  });

  it('opens and closes a group when its row is pressed', async () => {
    const user = userEvent.setup();

    render(<EditableTree />);

    await user.click(rowFor('cli'));

    expect(rowFor('cli-auto-approve-new-name-spaces')).not.toBeNull();

    await user.click(rowFor('cli'));

    expect(rowFor('cli-auto-approve-new-name-spaces')).toBeNull();
  });

  it('names each scope with the access it gives', () => {
    render(<EditableTree />);

    expect(
      within(rowFor('projects-read')).getByText(
        `${akMT('serviceAccountModule.scopes.projects.label')}:`
      )
    ).toBeInTheDocument();

    expect(within(rowFor('projects-read')).getByText(akMT('read'))).toBeInTheDocument();
  });

  it('grants every scope under a group when the group is ticked', async () => {
    const user = userEvent.setup();

    render(<EditableTree />);

    await user.click(within(rowFor('user')).getByRole('checkbox'));

    /* The group holds its rows until it is opened, as irene's tree does. */
    await user.click(rowFor('user'));

    expect(within(rowFor('user')).getByRole('checkbox')).toBeChecked();
    expect(within(rowFor('user-read')).getByRole('checkbox')).toBeChecked();
    expect(within(rowFor('user-write')).getByRole('checkbox')).toBeChecked();
  });

  it('shows a group as part-granted while only one scope under it is', async () => {
    const user = userEvent.setup();

    render(<EditableTree />);

    await user.click(within(rowFor('user')).getByRole('checkbox'));
    await user.click(rowFor('user'));
    await user.click(within(rowFor('user-write')).getByRole('checkbox'));

    expect(within(rowFor('user')).getByRole('checkbox')).toHaveAttribute(
      'data-state',
      'indeterminate'
    );
  });

  it('grants the upload access an approval of new namespaces needs', async () => {
    const user = userEvent.setup();

    render(<EditableTree />);

    await user.click(rowFor('upload'));
    await user.click(within(rowFor('auto-approve-new-name-spaces')).getByRole('checkbox'));

    expect(within(rowFor('upload-app')).getByRole('checkbox')).toBeChecked();

    expect(within(rowFor('auto-approve-new-name-spaces')).getByRole('checkbox')).toBeChecked();
  });

  it('draws each scope’s state instead of a box where the scopes are only read', () => {
    render(<ScopeTree scopes={{ ...NO_SCOPES, scope_public_api_project_read: true }} />);

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    expect(within(rowFor('projects-read')).getByLabelText(akMT('granted'))).toBeInTheDocument();

    expect(
      within(rowFor('scan-results-va-read')).getByLabelText(akMT('notGranted'))
    ).toBeInTheDocument();
  });
});
