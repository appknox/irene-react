import { isDestroyed, registerDestructor } from '@ember/destroyable';
import Modifier from 'ember-modifier';

import ENV from 'irene/config/environment';
import {
  loadReactEmbed,
  type EmbedMountedComponent,
} from 'irene/utils/react-embed';

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

  /**
   * Takes the placeholder down, leaving the other app's element behind.
   *
   * @param element - What this modifies, which holds the placeholder.
   * @param container - The element the other app renders into.
   */
  #takeDownPlaceholder(element: HTMLElement, container: HTMLElement) {
    for (const child of Array.from(element.children)) {
      if (child !== container) {
        child.remove();
      }
    }
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

      /*
        The other app renders beside the block rather than over it. The block
        stays until that app says it has something to show, so one placeholder
        covers the whole wait: this bundle arriving, then the screen's own data
        loading.
      */
      const container = document.createElement('div');

      element.append(container);

      this.#component = mountIreneComponent(container, {
        name: named.name,
        props: named.props,
        config: this.buildConfig(),
        version: String(ENV.version),
        onReady: () => this.#takeDownPlaceholder(element, container),
      });
    });
  }
}
