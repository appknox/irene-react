import { registerDestructor } from '@ember/destroyable';
import Modifier from 'ember-modifier';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { REACT_SCREENS, ScreenRoot, type ReactScreenName } from 'irene-react';

interface ReactScreenSignature {
  Element: HTMLElement;
  Args: {
    Named: { name: ReactScreenName };
  };
}

/**
 * Renders a React screen into the element this modifies.
 *
 * Glimmer only reconciles nodes bound to tracked values, so the element handed
 * over here is left alone and React owns everything inside it — including what
 * it reads from the API. This app supplies the element and nothing else.
 */
export default class ReactScreenModifier extends Modifier<ReactScreenSignature> {
  #root?: Root;

  modify(element: HTMLElement, _positional: [], named: { name: ReactScreenName }) {
    this.#root ??= createRoot(element);

    registerDestructor(this, () => this.#root?.unmount());

    this.#root.render(createElement(ScreenRoot, { screen: REACT_SCREENS[named.name] }));
  }
}
