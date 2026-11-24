import Component from '@glimmer/component';

/**
 * Stands in for the namespaces table while the React app loads it.
 *
 * It mirrors that table — a header row and a few rows of cells — so the frame
 * does not shift when the React app takes the element over.
 */
export default class OrganizationNamespaceLoadingUiComponent extends Component {
  /** One per placeholder row. The ids only key the loop. */
  get rows() {
    return [1, 2, 3, 4, 5];
  }

  /** The three columns the table shows, at the widths it gives them. */
  get columns() {
    return ['40%', '30%', '30%'];
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    'OrganizationNamespace::LoadingUi': typeof OrganizationNamespaceLoadingUiComponent;
  }
}
