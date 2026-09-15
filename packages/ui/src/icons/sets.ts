/**
 * The icons this design system uses, listed per Iconify set.
 *
 * `pnpm build:icons` reads these lists and writes icons.json containing only
 * the named icons — a set holds thousands, and shipping whole sets would add
 * megabytes to the bundle.
 *
 * Adding an icon means adding its name here and running that script. The names
 * are checked against the set at build time, so a typo fails rather than
 * rendering an empty box.
 *
 * Six names carried over from the Ember app were dropped: arrow-down,
 * double-arrow-left, double-arrow-right, email, remove-circle and windows.
 * None resolve in material-symbols, so they have never rendered — the old
 * build dropped them silently.
 */

/** https://icon-sets.iconify.design/material-symbols/ */
export const materialSymbols = [
  'account-balance',
  'account-box',
  'account-circle',
  'account-tree',
  'add',
  'add-box',
  'add-column-right-outline-rounded',
  'android',
  'apps',
  'archive',
  'arrow-back',
  'arrow-downward',
  'arrow-drop-down',
  'arrow-drop-up',
  'arrow-forward',
  'arrow-left',
  'arrow-outward',
  'arrow-right',
  'arrow-right-alt',
  'arrow-selector-tool',
  'arrow-upward',
  'article',
  'assignment',
  'auto-awesome',
  'auto-awesome-outline',
  'auto-fix-high',
  'auto-graph',
  'beenhere',
  'block',
  'border-color',
  'border-color-outline',
  'bug-report',
  'build',
  'calendar-month',
  'cancel',
  'cards-sharp',
  'chat-bubble',
  'check',
  'check-circle',
  'chevron-left',
  'chevron-right',
  'circle',
  'circle-outline',
  'close',
  'cloud-upload',
  'compare',
  'compare-arrows',
  'content-copy',
  'content-copy-outline',
  'content-paste',
  'content-paste-search',
  'credit-card',
  'credit-card-outline',
  'date-range',
  'delete',
  'delete-outline',
  'description',
  'description-outline',
  'desktop-windows',
  'distance',
  'do-not-disturb-on',
  'do-not-disturb-on-outline',
  'done',
  'download',
  'download-done',
  'downloading',
  'draft-outline',
  'drag-handle',
  'drag-indicator',
  'drag-pan',
  'drive-file-rename-outline',
  'dynamic-feed',
  'east',
  'edit',
  'edit-outline',
  'error',
  'event',
  'event-note',
  'expand-more',
  'experiment',
  'family-history',
  'file-upload',
  'filter-list',
  'folder',
  'folder-outline',
  'format-list-bulleted',
  'format-size',
  'graphic-eq',
  'group',
  'group-add',
  'groups',
  'groups-2',
  'help',
  'history',
  'history-toggle-off',
  'home',
  'hourglass-pause',
  'hourglass-top',
  'import-contacts',
  'indeterminate-check-box',
  'info',
  'integration-instructions',
  'inventory-2',
  'key',
  'keyboard-arrow-down',
  'keyboard-arrow-up',
  'keyboard-backspace',
  'keyboard-return',
  'keyboard-tab',
  'language',
  'license-outline-rounded',
  'lightbulb',
  'link',
  'list-alt-check',
  'location-searching',
  'lock',
  'lock-open',
  'lock-open-outline',
  'logout',
  'mail',
  'menu',
  'mobile',
  'more-vert',
  'network-intel-node',
  'north-east',
  'note-add',
  'notifications',
  'open-in-full',
  'open-in-new',
  'pending-actions-sharp',
  'person',
  'person-add',
  'person-off',
  'person-off-outline',
  'person-outline',
  'person-remove',
  'play-arrow',
  'rate-review',
  'receipt-long',
  'refresh',
  'remove',
  'reorder',
  'replay',
  'report',
  'schedule',
  'schedule-send',
  'search',
  'security',
  'send',
  'settings',
  'settings-applications',
  'shape-line',
  'shield',
  'shield-outline',
  'show-chart',
  'sort',
  'south',
  'stop',
  'stop-circle',
  'subdirectory-arrow-right',
  'supervisor-account',
  'supervisor-account-outline',
  'support',
  'swipe',
  'sync-alt',
  'terminal-2',
  'text-snippet',
  'text-snippet-outline',
  'timer',
  'timer-outline',
  'touch-app',
  'touch-long',
  'trending-down',
  'trending-up',
  'unarchive',
  'undo',
  'unfold-less',
  'unfold-more',
  'verified',
  'verified-user',
  'view-list',
  'view-stream',
  'visibility',
  'visibility-off',
  'warning',
  'wb-incandescent',
  'west',
] as const;

/** https://icon-sets.iconify.design/mdi/ */
export const mdi = [
  'calendar-month-outline',
  'checkbox-blank-outline',
  'checkbox-marked',
  'delete',
  'file-certificate-outline',
  'fire',
  'insert-drive-file',
  'microsoft-excel',
  'minus-box',
  'progress-clock',
  'radio-button-checked',
  'radio-button-unchecked',
  'report-problem',
  'wand',
] as const;

/** https://icon-sets.iconify.design/hugeicons/ */
export const hugeicons = ['ai-brain-04', 'ai-magic', 'api', 'image-03'] as const;

/** https://icon-sets.iconify.design/fa-brands/ */
export const faBrands = ['apple'] as const;

/** https://icon-sets.iconify.design/ic/ */
export const ic = ['outline-drive-file-rename-outline'] as const;

/** https://icon-sets.iconify.design/bx/ */
export const bx = ['mobile-alt'] as const;

/** https://icon-sets.iconify.design/ph/ */
export const ph = ['diamonds-four'] as const;

/** https://icon-sets.iconify.design/mynaui/ */
export const mynaui = ['frame'] as const;

/** https://icon-sets.iconify.design/solar/ */
export const solar = ['library-linear', 'play-bold'] as const;

/** https://icon-sets.iconify.design/iconoir/ */
export const iconoir = ['screenshot'] as const;

/** https://icon-sets.iconify.design/fluent/ */
export const fluent = ['app-recent-24-regular'] as const;

/** https://icon-sets.iconify.design/streamline-plump/ */
export const streamlinePlump = ['threat-phone'] as const;

/** https://icon-sets.iconify.design/ix/ */
export const ix = ['ai'] as const;

/** https://icon-sets.iconify.design/majesticons/ */
export const majesticons = ['pulse'] as const;

/** https://icon-sets.iconify.design/mi/ */
export const mi = ['select'] as const;

export const iconSets = {
  'material-symbols': materialSymbols,
  mdi: mdi,
  hugeicons: hugeicons,
  'fa-brands': faBrands,
  ic: ic,
  bx: bx,
  ph: ph,
  mynaui: mynaui,
  solar: solar,
  iconoir: iconoir,
  fluent: fluent,
  'streamline-plump': streamlinePlump,
  ix: ix,
  majesticons: majesticons,
  mi: mi,
} as const;

export type IconSet = keyof typeof iconSets;

/** Every name this build knows about, as `set:icon`. */
export type IconName = {
  [Set in IconSet]: `${Set}:${(typeof iconSets)[Set][number]}`;
}[IconSet];

/** Every icon name grouped by set, typed as the `set:icon` union.
 *
 * Written out rather than derived: TypeScript cannot correlate a generic set
 * key with its own names inside a template literal, and the annotation here
 * makes the compiler check each entry instead of us asserting it.
 */
export const iconNamesBySet: {
  [TSet in IconSet]: `${TSet}:${(typeof iconSets)[TSet][number]}`[];
} = {
  'material-symbols': materialSymbols.map((name) => `material-symbols:${name}` as const),
  mdi: mdi.map((name) => `mdi:${name}` as const),
  hugeicons: hugeicons.map((name) => `hugeicons:${name}` as const),
  'fa-brands': faBrands.map((name) => `fa-brands:${name}` as const),
  ic: ic.map((name) => `ic:${name}` as const),
  bx: bx.map((name) => `bx:${name}` as const),
  ph: ph.map((name) => `ph:${name}` as const),
  mynaui: mynaui.map((name) => `mynaui:${name}` as const),
  solar: solar.map((name) => `solar:${name}` as const),
  iconoir: iconoir.map((name) => `iconoir:${name}` as const),
  fluent: fluent.map((name) => `fluent:${name}` as const),
  'streamline-plump': streamlinePlump.map((name) => `streamline-plump:${name}` as const),
  ix: ix.map((name) => `ix:${name}` as const),
  majesticons: majesticons.map((name) => `majesticons:${name}` as const),
  mi: mi.map((name) => `mi:${name}` as const),
};
