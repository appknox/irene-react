import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';

import { applyScopeChange, NO_SCOPES, type ScopeNode } from '../scopes';
import { SelectScopeSection } from './select-scope';

/** The section as the create screen drives it. */
function ScopeSection() {
  const [scopes, setScopes] = useState(NO_SCOPES);

  return (
    <SelectScopeSection
      scopes={scopes}
      onChange={(node: ScopeNode, isGranted: boolean) =>
        setScopes((current) => applyScopeChange(current, node, isGranted))
      }
    />
  );
}

describe('the select scope section', () => {
  it('names itself and holds the tree', () => {
    render(<ScopeSection />);

    expect(screen.getByText(akMT('selectScope'))).toBeInTheDocument();
    expect(document.querySelector('[data-test-ak-tree]')).not.toBeNull();
  });

  it('grants a scope through the tree inside it', async () => {
    const user = userEvent.setup();

    render(<ScopeSection />);

    const row = document.querySelector('[data-test-ak-tree-row="team-operations"]') as HTMLElement;

    await user.click(within(row).getByRole('checkbox'));

    expect(within(row).getByRole('checkbox')).toBeChecked();
  });
});
