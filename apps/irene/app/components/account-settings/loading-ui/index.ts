import Component from '@glimmer/component';

/**
 * Stands in for the account settings screen while the React app loads it.
 *
 * It mirrors that screen's own placeholder — the heading, the tab row and the
 * panel holding the first tab — so the frame does not shift when the React app
 * takes the element over. The two change together.
 */
export default class AccountSettingsLoadingUiComponent extends Component {
  /** One per tab, each about as wide as its label at the tab row's font size. */
  get tabLabelWidths() {
    return ['3.5rem', '3.9rem', '8.6rem', '11.3rem'];
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    'AccountSettings::LoadingUi': typeof AccountSettingsLoadingUiComponent;
  }
}
