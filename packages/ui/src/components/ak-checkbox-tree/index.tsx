import { Fragment, useState, type ReactNode } from 'react';

import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkIcon } from '@irene/ui/ak-icon';
import { cn } from '@irene/ui/cn';

/** How far each level sits in: (depth + 1) × 1em at the root, and 1.25em below it. */
const INDENTS = ['pl-3.5', 'pl-8.75', 'pl-13.25'];

/** One row of the tree. What it stands for is the caller's business. */
export interface AkTreeNode {
  key: string;
  children?: AkTreeNode[];
}

interface AkCheckboxTreeProps<TNode extends AkTreeNode> {
  nodes: TNode[];

  /** Whether a row is ticked, and whether only part of what it holds is. */
  isChecked: (node: TNode) => boolean;
  isPartlyChecked?: (node: TNode) => boolean;

  /** What the row says it is. */
  renderLabel: (node: TNode) => ReactNode;

  /** Absent where the tree is read rather than set, which draws each row's state instead. */
  onCheck?: (node: TNode, isChecked: boolean) => void;

  /** The rows open when the tree is first drawn. */
  defaultExpanded?: string[];

  /** What a row's state is called while the tree is read. */
  checkedLabel?: string;
  uncheckedLabel?: string;
}

interface AkTreeMarkProps<TNode extends AkTreeNode> {
  node: TNode;
  isChecked: boolean;
  isPartlyChecked: boolean;
  onCheck?: (node: TNode, isChecked: boolean) => void;
  checkedLabel?: string;
  uncheckedLabel?: string;
}

/** What a row carries at its start: a box to tick, or the state it is already in. */
function AkTreeMark<TNode extends AkTreeNode>({
  node,
  isChecked,
  isPartlyChecked,
  onCheck,
  checkedLabel,
  uncheckedLabel,
}: Readonly<AkTreeMarkProps<TNode>>) {
  if (!onCheck) {
    return (
      <AkIcon
        name={isChecked ? 'material-symbols:done' : 'material-symbols:do-not-disturb-on-outline'}
        className={cn('size-5.25', isChecked ? 'text-success' : 'text-neutral-300')}
        aria-label={isChecked ? checkedLabel : uncheckedLabel}
        data-test-ak-tree-state={isChecked ? 'checked' : 'unchecked'}
      />
    );
  }

  return (
    <AkCheckbox
      checked={isPartlyChecked ? 'indeterminate' : isChecked}
      onCheckedChange={(next) => onCheck(node, next === true)}
      /* The row around it opens the group; ticking is its own. */
      onClick={(event) => event.stopPropagation()}
      data-test-ak-tree-checkbox={node.key}
    />
  );
}

interface AkTreeRowProps<TNode extends AkTreeNode> extends Omit<
  AkCheckboxTreeProps<TNode>,
  'nodes' | 'defaultExpanded'
> {
  node: TNode;
  depth: number;
  expanded: string[];
  onToggleExpanded: (key: string) => void;
}

/** One row, and the rows beneath it while it is open. */
function AkTreeRow<TNode extends AkTreeNode>({
  node,
  depth,
  expanded,
  onToggleExpanded,
  isChecked,
  isPartlyChecked,
  renderLabel,
  onCheck,
  checkedLabel,
  uncheckedLabel,
}: Readonly<AkTreeRowProps<TNode>>) {
  const isOpen = expanded.includes(node.key);
  const hasChildren = Boolean(node.children?.length);
  const toggle = hasChildren ? () => onToggleExpanded(node.key) : undefined;

  return (
    <Fragment>
      <div
        className={cn(
          'flex w-full items-center justify-between border border-border bg-background',
          depth === 0 ? 'h-12 p-3.25' : 'p-2.75',
          /* A group below the root is set off, as irene tints its secondary rows. */
          depth > 0 && hasChildren && 'bg-background-subtle',
          hasChildren && 'cursor-pointer',
          INDENTS[depth]
        )}
        /* A group's row is the control that opens it, so it answers the keyboard too. */
        role={hasChildren ? 'button' : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        aria-expanded={hasChildren ? isOpen : undefined}
        onClick={toggle}
        onKeyDown={
          toggle &&
          ((event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggle();
            }
          })
        }
        data-slot="tree-row"
        data-test-ak-tree-row={node.key}
      >
        {/* No gap: the box brings its own padding, which is the space irene leaves here. */}
        <div className="flex items-center">
          <AkTreeMark
            node={node}
            isChecked={isChecked(node)}
            isPartlyChecked={isPartlyChecked?.(node) ?? false}
            onCheck={onCheck}
            checkedLabel={checkedLabel}
            uncheckedLabel={uncheckedLabel}
          />

          {renderLabel(node)}
        </div>

        {hasChildren && (
          <AkIcon
            name="material-symbols:arrow-drop-down"
            className={cn('size-6 text-secondary transition-transform', !isOpen && '-rotate-90')}
            data-test-ak-tree-expander={node.key}
          />
        )}
      </div>

      {isOpen &&
        node.children?.map((child) => (
          <AkTreeRow
            key={child.key}
            node={child as TNode}
            depth={depth + 1}
            expanded={expanded}
            onToggleExpanded={onToggleExpanded}
            isChecked={isChecked}
            isPartlyChecked={isPartlyChecked}
            renderLabel={renderLabel}
            onCheck={onCheck}
            checkedLabel={checkedLabel}
            uncheckedLabel={uncheckedLabel}
          />
        ))}
    </Fragment>
  );
}

/**
 * A tree of rows that are ticked, grouped by what holds them.
 *
 * A group's row opens and closes what is under it, and its checkbox is its own:
 * pressing the row never ticks it. What a row stands for, and what ticking one
 * means for the rest, are the caller's: this draws the tree and reports the
 * presses. Read-only — no `onCheck` — each row shows its state instead of a box.
 *
 * @param props.nodes - The roots of the tree.
 * @param props.isChecked - Whether a row is ticked.
 * @param props.isPartlyChecked - Whether only part of what a row holds is ticked.
 * @param props.renderLabel - What a row says it is.
 * @param props.onCheck - Called with the row and what it was set to; absent while read-only.
 * @param props.defaultExpanded - The rows open when the tree is first drawn.
 * @param props.checkedLabel - What a ticked row's mark is called while the tree is read.
 * @param props.uncheckedLabel - What an unticked row's mark is called.
 */
export function AkCheckboxTree<TNode extends AkTreeNode>({
  nodes,
  defaultExpanded = [],
  ...row
}: Readonly<AkCheckboxTreeProps<TNode>>) {
  const [expanded, setExpanded] = useState<string[]>(defaultExpanded);

  const toggleExpanded = (key: string) =>
    setExpanded((open) => (open.includes(key) ? open.filter((k) => k !== key) : [...open, key]));

  return (
    <div
      /* Every row but the first drops its top border, so two never draw 2px between them. */
      className="flex w-full flex-col [&>[data-slot=tree-row]:not(:first-child)]:border-t-0"
      data-slot="tree"
      data-test-ak-tree
    >
      {nodes.map((node) => (
        <AkTreeRow
          key={node.key}
          node={node}
          depth={0}
          expanded={expanded}
          onToggleExpanded={toggleExpanded}
          {...row}
        />
      ))}
    </div>
  );
}
