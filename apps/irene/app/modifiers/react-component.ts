import { isDestroyed, registerDestructor } from '@ember/destroyable';
import Modifier from 'ember-modifier';

import ENV from 'irene/config/environment';
import { loadReactEmbed, type EmbedMountedComponent } from 'irene/utils/react-embed';

interface ReactComponentArgs {
  /** Which React component to render. */
  name: string;

  /** What to render it with. */
  props?: Record<string, unknown>;
}

interface ReactComponentModifierSignature {
  Element: HTMLElement;
  Args: { Named: ReactComponentArgs };
}

/**
 * Renders one React component into the element this modifies.
 *
 * Unlike a whole page, a component arrives with no router and no route of its
 * own — it takes props and renders. This app keeps its route, its template and
 * everything around it.
 */
export default class ReactComponentModifier extends Modifier<ReactComponentModifierSignature> {
  #component?: EmbedMountedComponent;
  #loading = false;

  /**
   * This app's resolved configuration, for the React side to read instead of
   * the values its own build would have frozen in.
   *
   * @returns Every configuration key this deployment actually set.
   */
  buildConfig(): Record<string, string> {
    return Object.fromEntries(
      Object.entries(ENV.ENVHandlerCONST.processENV).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string'
      )
    );
  }

  modify(element: HTMLElement, _positional: [], named: ReactComponentArgs) {
    if (this.#component) {
      this.#component.update(named.props);

      return;
    }

    if (this.#loading) {
      return;
    }

    this.#loading = true;

    registerDestructor(this, () => this.#component?.destroy());

    void loadReactEmbed().then(({ mountIreneComponent }) => {
      if (isDestroyed(this)) {
        return;
      }

      this.#component = mountIreneComponent(element, {
        name: named.name,
        props: named.props,
        config: this.buildConfig(),
      });
    });
  }
}
