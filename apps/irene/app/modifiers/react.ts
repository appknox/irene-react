import { registerDestructor } from '@ember/destroyable';
import { service } from '@ember/service';
import type RouterService from '@ember/routing/router-service';
import type { SessionService } from 'irene/adapters/auth-base';
import Modifier from 'ember-modifier';
import { mountIrenePage, type MountedPage } from '@irene/dashboard/embed';

import ENV from 'irene/config/environment';
import { sharedResponses } from 'irene/utils/react-responses';

/** The progress bar this app starts for its own screens. */
interface PaceProgressBar {
  start(): void;
  stop(): void;
}

/**
 * Hands the progress bar over while a React page is on screen.
 *
 * Pace reports on every request and on main-thread lag, and restarts for any
 * request made more than `restartOnRequestAfter` since it last finished. An
 * embedded page makes its own requests on its own schedule and reports its own
 * progress, so the two bars would run against each other and this one would
 * look as though it never ends.
 *
 * @param running - Whether this app's own bar should be reporting.
 */
function setPaceRunning(running: boolean) {
  const pace = (window as { Pace?: PaceProgressBar }).Pace;

  if (running) {
    pace?.start();
  } else {
    pace?.stop();
  }
}

interface ReactPageModifierSignature {
  Element: HTMLElement;
  Args: {
    Named: { path?: string };
  };
}

/**
 * Renders a React page into the element this modifies.
 *
 * Everything about how that page mounts belongs to the React side. This passes
 * it the element, this app's configuration, and a way to hand links back to
 * this app's router.
 */
export default class ReactPageModifier extends Modifier<ReactPageModifierSignature> {
  @service declare router: RouterService;
  @service declare session: SessionService;

  #page?: MountedPage;

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
   * Whether this app's router can take a path itself.
   *
   * @param path - Where the embedded page wants to go.
   * @returns Whether a route of this app's answers it.
   */
  canTransitionTo(path: string): boolean {
    try {
      return Boolean(this.router.recognize(path));
    } catch {
      /* An unrecognised URL throws rather than answering, which is the answer. */
      return false;
    }
  }

  /**
   * Follows a navigation an embedded page asked for.
   *
   * Loads the document rather than transitioning in two cases. A sign-in page
   * authenticates on the React side, so this app's session is still empty and
   * only a fresh start picks it up. And a path this app has no route for is
   * one the server has to answer.
   *
   * Either way the address bar moves: an embedded page asking to navigate and
   * nothing happening is the one outcome to avoid.
   *
   * @param path - Where the embedded page wants to go.
   */
  followNavigation(path: string) {
    if (this.session.isAuthenticated && this.canTransitionTo(path)) {
      this.router.transitionTo(path);

      return;
    }

    window.location.assign(path);
  }

  modify(element: HTMLElement, _positional: [], named: { path?: string }) {
    const options = {
      path: named.path,
      config: this.buildConfig(),
      responses: sharedResponses(),
      onNavigate: (path: string) => this.followNavigation(path),
    };

    if (!this.#page) {
      setPaceRunning(false);

      this.#page = mountIrenePage(element, options);

      registerDestructor(this, () => {
        this.#page?.destroy();
        setPaceRunning(true);
      });

      return;
    }

    this.#page.update(options);
  }
}
