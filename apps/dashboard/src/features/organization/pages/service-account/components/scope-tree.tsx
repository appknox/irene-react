import { Fragment } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkCheckboxTree } from '@irene/ui/ak-checkbox-tree';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';
import type { ApiServiceAccountScopes } from '@irene/api/services/service-account';

import { isNodeChecked, isNodePartlyChecked, SCOPE_TREE, type ScopeNode } from '../scopes';

/** What a row says it is: a group's own name, or a scope with its access and an explanation. */
function ScopeLabel({ node }: Readonly<{ node: ScopeNode }>) {
  if (node.label && !node.scopeLabel) {
    return (
      <AkTypography tag="span" variant="h6" data-test-scope-label>
        {node.label()}
      </AkTypography>
    );
  }

  return (
    <Fragment>
      <div className="flex items-center gap-1">
        <AkTypography tag="span" variant="h6" data-test-scope-label>
          {`${node.scopeLabel?.()}:`}
        </AkTypography>

        {node.accessType && (
          <AkTypography tag="span" color="textSecondary" data-test-scope-access>
            {node.accessType()}
          </AkTypography>
        )}
      </div>

      {node.description && (
        <AkTooltip arrow title={node.description()}>
          <AkIcon
            name="material-symbols:info"
            aria-label={node.description()}
            className="size-4 text-neutral-300"
            data-test-scope-info
          />
        </AkTooltip>
      )}
    </Fragment>
  );
}

interface ScopeTreeProps {
  scopes: ApiServiceAccountScopes;

  /** Absent where the scopes are only read, which draws each row's state instead of a box. */
  onChange?: (node: ScopeNode, isGranted: boolean) => void;
}

/**
 * What a service account may do, as a tree of scopes.
 *
 * The public API's root opens by default, as irene opens it, and a group
 * carries the rows beneath it: granting one grants them all.
 *
 * @param props.scopes - The scopes as they stand.
 * @param props.onChange - Called with the row and what it was set to; absent while read-only.
 */
export function ScopeTree({ scopes, onChange }: Readonly<ScopeTreeProps>) {
  return (
    <AkCheckboxTree
      nodes={SCOPE_TREE}
      defaultExpanded={['public-api']}
      isChecked={(node) => isNodeChecked(node, scopes)}
      isPartlyChecked={(node) => isNodePartlyChecked(node, scopes)}
      renderLabel={(node) => <ScopeLabel node={node} />}
      onCheck={onChange}
      checkedLabel={akMT('granted')}
      uncheckedLabel={akMT('notGranted')}
    />
  );
}
