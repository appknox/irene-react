import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AkCheckboxTree, type AkTreeNode } from '@irene/ui/ak-checkbox-tree';
import { AkTypography } from '@irene/ui/ak-typography';

interface Scope extends AkTreeNode {
  label: string;
  children?: Scope[];
}

const NODES: Scope[] = [
  {
    key: 'api',
    label: 'APIs',
    children: [
      { key: 'projects', label: 'Projects' },
      { key: 'users', label: 'Users' },
    ],
  },
  { key: 'cli', label: 'CLI' },
];

/** Every key a row stands for, which is how a group reads as ticked. */
const keysUnder = (node: Scope): string[] =>
  node.children ? node.children.flatMap(keysUnder) : [node.key];

/** The tree as a screen drives it: granted keys in state, groups carrying their rows. */
function Tree({ onCheck }: Readonly<{ onCheck?: (node: Scope, checked: boolean) => void }>) {
  const [granted, setGranted] = useState<string[]>([]);

  const change = (node: Scope, checked: boolean) => {
    const keys = keysUnder(node);

    setGranted((current) =>
      checked ? [...current, ...keys] : current.filter((key) => !keys.includes(key))
    );

    onCheck?.(node, checked);
  };

  return (
    <AkCheckboxTree
      nodes={NODES}
      defaultExpanded={['api']}
      isChecked={(node) => keysUnder(node).every((key) => granted.includes(key))}
      isPartlyChecked={(node) =>
        !keysUnder(node).every((key) => granted.includes(key)) &&
        keysUnder(node).some((key) => granted.includes(key))
      }
      renderLabel={(node) => <AkTypography tag="span">{node.label}</AkTypography>}
      onCheck={change}
    />
  );
}

const rowFor = (key: string) =>
  document.querySelector(`[data-test-ak-tree-row="${key}"]`) as HTMLElement;

describe('AkCheckboxTree', () => {
  it('draws the rows it is given, opening the ones it was told to', () => {
    render(<Tree />);

    expect(rowFor('api')).not.toBeNull();
    expect(rowFor('projects')).not.toBeNull();
    expect(rowFor('cli')).not.toBeNull();
  });

  it('opens and closes a group when its row is pressed', async () => {
    const user = userEvent.setup();

    render(<Tree />);

    await user.click(rowFor('api'));

    expect(rowFor('projects')).toBeNull();

    await user.click(rowFor('api'));

    expect(rowFor('projects')).not.toBeNull();
  });

  it('reports the row that was ticked, without opening or closing it', async () => {
    const user = userEvent.setup();
    const onCheck = vi.fn();

    render(<Tree onCheck={onCheck} />);

    await user.click(within(rowFor('api')).getByRole('checkbox'));

    expect(onCheck).toHaveBeenCalledWith(NODES[0], true);

    /* The group stays open: its box is its own, and the row's press is the expander. */
    expect(rowFor('projects')).not.toBeNull();
  });

  it('shows a group as part-ticked while only some of it is', async () => {
    const user = userEvent.setup();

    render(<Tree />);

    await user.click(within(rowFor('projects')).getByRole('checkbox'));

    expect(within(rowFor('api')).getByRole('checkbox')).toHaveAttribute(
      'data-state',
      'indeterminate'
    );
  });

  it('draws each row’s state instead of a box where it is only read', () => {
    render(
      <AkCheckboxTree
        nodes={NODES}
        defaultExpanded={['api']}
        isChecked={(node) => node.key === 'projects'}
        renderLabel={(node) => <AkTypography tag="span">{node.label}</AkTypography>}
        checkedLabel="Granted"
        uncheckedLabel="Not granted"
      />
    );

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(within(rowFor('projects')).getByLabelText('Granted')).toBeInTheDocument();
    expect(within(rowFor('users')).getByLabelText('Not granted')).toBeInTheDocument();
  });
});

describe('a group’s row as a control', () => {
  it('is announced as one, and says whether it is open', () => {
    render(<Tree />);

    expect(rowFor('api')).toHaveAttribute('role', 'button');
    expect(rowFor('api')).toHaveAttribute('aria-expanded', 'true');
    expect(rowFor('api')).toHaveAttribute('tabindex', '0');
  });

  it('opens on Enter and on Space, as a control does', async () => {
    const user = userEvent.setup();

    render(<Tree />);

    rowFor('api').focus();

    await user.keyboard('{Enter}');

    expect(rowFor('projects')).toBeNull();

    await user.keyboard(' ');

    expect(rowFor('projects')).not.toBeNull();
  });

  it('leaves a row that holds nothing as plain content', () => {
    render(<Tree />);

    expect(rowFor('cli')).not.toHaveAttribute('role');
    expect(rowFor('cli')).not.toHaveAttribute('tabindex');
  });
});
