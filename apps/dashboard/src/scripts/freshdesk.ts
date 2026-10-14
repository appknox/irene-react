import { FreshdeskService } from '@irene/api/services/freshdesk';
import { getApiErrorStatus } from '@irene/api/utils/errors';

/** What the widget is asked to do. Each command takes its own arguments. */
interface FreshworksWidget {
  (command: 'open' | 'close' | 'logout'): void;
  (command: 'hide' | 'show', element: 'launcher'): void;
  (command: 'authenticate', options: { token: string; callback?: () => void }): void;

  /** Commands taken before the script loaded, which the widget replays. */
  q?: unknown[][];
}

declare global {
  interface Window {
    FreshworksWidget?: FreshworksWidget;
    fwSettings?: { widget_id: string };
  }
}

const FRESHDESK_WIDGET_HOST = 'https://ind-widget.freshworks.com';
const SCRIPT_ID = 'freshdesk-widget';

/**
 * Whether the widget has finished installing.
 *
 * @returns Whether `FreshworksWidget` is there to be called.
 */
const _isInstalled = () => typeof window.FreshworksWidget === 'function';

/**
 * Stands in for the widget until its script has loaded.
 *
 * Commands taken in the meantime are queued on `q` for the widget to replay, so
 * the account is signed in without waiting on the script tag.
 *
 * @returns The stub, which the widget's own script replaces.
 */
function _createWidgetStub(): FreshworksWidget {
  const queue: unknown[][] = [];

  const stub = (...args: unknown[]) => {
    queue.push(args);
  };

  stub.q = queue;

  return stub as FreshworksWidget;
}

/**
 * Asks the API for a widget token.
 *
 * A 404 is the deployment answering that it holds no Freshdesk secret, so
 * support is unauthenticated here; that is a configuration, not a fault, and it
 * is not reported. Any other failure is logged and support is left
 * unauthenticated rather than taking the page down with it.
 *
 * @returns The token, or an empty string where the deployment grants none.
 */
async function _requestWidgetToken(): Promise<string> {
  try {
    const { token } = await FreshdeskService.authenticate();

    return token;
  } catch (error) {
    if (getApiErrorStatus(error) !== 404) {
      window.console.error('Freshdesk widget authentication failed', error);
    }

    return '';
  }
}

/**
 * Signs the account in to the widget, and again when the token expires.
 *
 * Called only with a token: the widget rejects an empty one, and answers the
 * rejection by failing its own bootstrap.
 *
 * @param token - The widget token this session signs in with.
 */
function _authenticateWidget(token: string) {
  window.FreshworksWidget?.('authenticate', {
    token,

    callback: () => {
      _requestWidgetToken().then((nextToken) => {
        if (nextToken) {
          _authenticateWidget(nextToken);
        }
      });
    },
  });
}

/**
 * Installs the support widget, once, with its launcher hidden.
 *
 * The navigation opens it instead, so the knowledge base is reached from the
 * same bar as everything else rather than from a tab floating over the page.
 *
 * The token is asked for before the script tag is added, and the commands that
 * follow are queued on the stub, so the widget replays them before it reaches
 * its own bootstrap. A restricted knowledge base refuses to bootstrap at all
 * without that token, so the order is the difference between support working
 * and support reporting `x_widget_auth_required`.
 *
 * `fwSettings` is set before the token is awaited, so a second call arriving
 * meanwhile finds the widget already being installed.
 *
 * @param widgetId - The install's Freshdesk widget id, which is empty where the
 *   support widget is off.
 */
export async function installFreshdesk(widgetId: string) {
  if (!widgetId || window.fwSettings) {
    return;
  }

  window.fwSettings = { widget_id: widgetId };
  window.FreshworksWidget = window.FreshworksWidget ?? _createWidgetStub();

  const token = await _requestWidgetToken();

  /* Without a token the knowledge base still opens, unless it is a restricted one. */
  if (token) {
    _authenticateWidget(token);
  }

  hideFreshdeskLauncher();

  const script = document.createElement('script');

  script.id = SCRIPT_ID;
  script.src = `${FRESHDESK_WIDGET_HOST}/widgets/${widgetId}.js`;
  script.async = true;

  document.head.appendChild(script);
}

/** Opens the knowledge base. */
export function openFreshdesk() {
  if (!_isInstalled()) {
    return;
  }

  window.FreshworksWidget?.('open');
}

/** Hides the widget's own launcher, since the navigation opens it instead. */
export function hideFreshdeskLauncher() {
  if (!_isInstalled()) {
    return;
  }

  window.FreshworksWidget?.('hide', 'launcher');
}

/** Signs the account out of the widget, for a session that is ending. */
export function signOutOfFreshdesk() {
  if (!_isInstalled()) {
    return;
  }

  window.FreshworksWidget?.('logout');
}
