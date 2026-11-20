import Component from '@glimmer/component';

export interface ReactComponentSignature {
  Element: HTMLDivElement;

  Args: {
    /** Which React component to render, by its name in the embed registry. */
    name: string;

    /** What to render it with. */
    props?: Record<string, unknown>;
  };

  Blocks: {
    /** Drawn until the other app has something to show. */
    default: [];
  };
}

/**
 * Renders one screen of the React app inside this one.
 *
 * The route, its template and everything around it stay here; only the element
 * this renders is the other app's. The modifier it carries does the mounting,
 * so a caller names the component and nothing else.
 *
 * The block holds the space until then, and stays up until that app reports it
 * has content — its bundle fetched and its data loaded. One placeholder covers
 * the whole wait that way, rather than this one being swapped for that app's
 * own halfway through.
 */
export default class ReactComponent extends Component<ReactComponentSignature> {}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    ReactComponent: typeof ReactComponent;
  }
}
