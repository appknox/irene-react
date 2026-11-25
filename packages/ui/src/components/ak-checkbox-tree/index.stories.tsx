import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkCheckboxTree, type AkTreeNode } from '@irene/ui/ak-checkbox-tree';
import { AkTypography } from '@irene/ui/ak-typography';

/** A scope a service account may be given, which is what this tree was drawn for. */
interface Scope extends AkTreeNode {
  label: string;
  access?: string;
  children?: Scope[];
}

const SCOPES: Scope[] = [
  {
    key: 'api',
    label: 'APIs',

    children: [
      { key: 'projects', label: 'Projects', access: 'Read' },
      { key: 'scan-results', label: 'Scan Results (VA)', access: 'Read' },
      {
        key: 'users',
        label: 'Users',

        children: [
          { key: 'user-read', label: 'User Read', access: 'Read' },
          { key: 'user-write', label: 'User Write', access: 'Write' },
        ],
      },
    ],
  },
  { key: 'cli', label: 'CLI' },
];

/** Every scope a row stands for, so a group reads as granted only when all of them are. */
const scopesUnder = (node: Scope): string[] =>
  node.children ? node.children.flatMap(scopesUnder) : [node.key];

/** What a row says it is: its name, and the access it gives where it gives one. */
function ScopeLabel({ node }: Readonly<{ node: Scope }>) {
  return (
    <div className="flex items-center gap-1">
      <AkTypography tag="span" variant="h6">
        {node.access ? `${node.label}:` : node.label}
      </AkTypography>

      {node.access && (
        <AkTypography tag="span" color="textSecondary">
          {node.access}
        </AkTypography>
      )}
    </div>
  );
}

/** The tree as a screen drives it: what is granted in state, groups carrying their rows. */
function GrantedScopes() {
  const [granted, setGranted] = useState<string[]>(['projects']);

  const isGranted = (node: Scope) => scopesUnder(node).every((key) => granted.includes(key));

  return (
    <AkCheckboxTree
      nodes={SCOPES}
      defaultExpanded={['api']}
      isChecked={isGranted}
      isPartlyChecked={(node) =>
        !isGranted(node) && scopesUnder(node).some((key) => granted.includes(key))
      }
      renderLabel={(node) => <ScopeLabel node={node} />}
      onCheck={(node, checked) => {
        const keys = scopesUnder(node);

        setGranted((current) =>
          checked ? [...current, ...keys] : current.filter((key) => !keys.includes(key))
        );
      }}
    />
  );
}

/** The same scopes, read rather than set. */
function ReadScopes() {
  return (
    <AkCheckboxTree
      nodes={SCOPES}
      defaultExpanded={['api', 'users']}
      isChecked={(node) => ['projects', 'user-read'].includes(node.key)}
      renderLabel={(node) => <ScopeLabel node={node} />}
      checkedLabel="Granted"
      uncheckedLabel="Not granted"
    />
  );
}

const meta = {
  title: 'Components/AkCheckboxTree',
  component: AkCheckboxTree,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },

  /* Every story draws its own tree, so these only satisfy the component's own shape. */
  args: {
    nodes: SCOPES,
    isChecked: () => false,
    renderLabel: (node) => <ScopeLabel node={node as Scope} />,
  },
} satisfies Meta<typeof AkCheckboxTree>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Rows that are ticked, with a group carrying everything beneath it. */
export const Default: Story = { render: () => <GrantedScopes /> };

/** Read rather than set: each row shows the state it is in, with no box to press. */
export const ReadOnly: Story = { render: () => <ReadScopes /> };
