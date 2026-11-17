import { AkMenu, AkMenuContent, AkMenuItem, AkMenuSeparator, AkMenuTrigger } from '@irene/ui/ak-menu';

import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { akNotify } from '@irene/ui/notify';

interface MoreMenuProps {
  isPinned: boolean;
  isChanged: boolean;
  isRefreshing: boolean;
  onSaveAsNew: () => void;
  onTogglePin: () => void;
  onRefresh: () => void;
  onDiscard: () => void;
  onDelete: () => void;
}

/** Puts the page's address on the clipboard, or says to copy it from the address bar. */
const _copyLink = () => {
  navigator.clipboard
    .writeText(window.location.href)
    .then(() => akNotify.success(akMT('reportModule.view.linkCopied')))
    .catch(() => akNotify.error(akMT('reportModule.view.linkCopyFailed')));
};

/**
 * A saved report's other actions: save as new, pin or unpin, copy its link,
 * refresh its data, discard unsaved changes, and delete it.
 *
 * @param props.isPinned - Whether it is pinned.
 * @param props.isChanged - Whether there are unsaved changes to discard.
 * @param props.isRefreshing - Whether its data is being refreshed.
 * @param props.onSaveAsNew - Opens the save-as-new drawer.
 * @param props.onTogglePin - Pins or unpins it.
 * @param props.onRefresh - Refreshes its data.
 * @param props.onDiscard - Discards unsaved changes.
 * @param props.onDelete - Opens the delete confirmation.
 */
export function MoreMenu(props: Readonly<MoreMenuProps>) {
  return (
    <AkMenu>
      <AkMenuTrigger asChild>
        <AkIconButton aria-label={akMT('reportModule.view.moreActions')} className="border border-border" data-test-report-more>
          <AkIcon name="material-symbols:more-horiz" />
        </AkIconButton>
      </AkMenuTrigger>

      {/* Focus is not handed back to the trigger: the drawer or rename field just opened keeps it. */}
      <AkMenuContent onCloseAutoFocus={(event) => event.preventDefault()}>
        <AkMenuItem onSelect={props.onSaveAsNew}>
          <AkIcon name="material-symbols:content-copy-outline" />
          {akMT('reportModule.view.saveAsNewEllipsis')}
        </AkMenuItem>

        <AkMenuItem onSelect={props.onTogglePin}>
          <AkIcon name={props.isPinned ? 'material-symbols:push-pin' : 'material-symbols:push-pin-outline'} />
          {props.isPinned ? akMT('reportModule.savedReports.unpin') : akMT('reportModule.savedReports.pin')}
        </AkMenuItem>

        <AkMenuItem onSelect={_copyLink}>
          <AkIcon name="material-symbols:link" />
          {akMT('reportModule.view.copyLink')}
        </AkMenuItem>

        <AkMenuItem disabled={props.isRefreshing} onSelect={props.onRefresh}>
          <AkIcon name="material-symbols:refresh" />
          {akMT('reportModule.savedReports.refreshData')}
        </AkMenuItem>

        <AkMenuItem disabled={!props.isChanged} onSelect={props.onDiscard}>
          <AkIcon name="material-symbols:undo" />
          {akMT('reportModule.view.discardChanges')}
        </AkMenuItem>

        <AkMenuSeparator />

        <AkMenuItem className="text-danger" onSelect={props.onDelete}>
          <AkIcon name="material-symbols:delete-outline" />
          {akMT('reportModule.savedReports.deleteReport')}
        </AkMenuItem>
      </AkMenuContent>
    </AkMenu>
  );
}
