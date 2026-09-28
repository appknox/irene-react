import { PENDO_API_KEY } from '@irene/config/product';

/** One guide the agent is running, as Pendo reports it. */
interface PendoGuide {
  launchMethod: string;
  show: () => void;
}

/** Who the guides are shown to, and which account they belong to. */
interface PendoVisitor {
  visitor: { id: number | string; email: string };
  account: { id: string };
}

interface PendoAgent {
  _q?: unknown[][];
  initialize?: (visitor: PendoVisitor) => void;
  identify?: (visitor: PendoVisitor) => void;
  updateOptions?: (visitor: PendoVisitor) => void;
  pageLoad?: () => void;
  getActiveGuides?: () => PendoGuide[];
}

declare global {
  interface Window {
    pendo?: PendoAgent;
  }
}

/*
  The badge a guide attaches itself to. Pendo looks the element up by id, so the
  release row in the navigation carries it wherever the guides are enabled.
*/
export const PENDO_CONTAINER_ID = 'ak-pendo-version-container';
const PENDO_SCRIPT_ID = 'pendo-agent';

/**
 * Stands in for the agent until its script has loaded.
 *
 * Everything called in the meantime is queued for the agent to replay, with
 * `initialize` put first: the rest mean nothing until the visitor is known.
 * Without this the account is identified into nothing, the agent boots
 * anonymous, and neither the guides nor the designer have anyone to run for.
 *
 * @returns The queueing stub the agent replaces.
 */
function _createAgentStub(): PendoAgent {
  const queue: unknown[][] = [];

  const enqueue =
    (method: string) =>
    (...args: unknown[]) => {
      queue[method === 'initialize' ? 'unshift' : 'push']([method, ...args]);
    };

  return {
    _q: queue,
    initialize: enqueue('initialize'),
    identify: enqueue('identify'),
    updateOptions: enqueue('updateOptions'),
    pageLoad: enqueue('pageLoad'),
  };
}

/**
 * Loads the Pendo agent, once.
 *
 * The agent is a script on the page rather than a module, so a stub stands in
 * for it until it has loaded and identifying the account straight afterwards
 * is safe.
 *
 * @param apiKey - The agent to load, which an install may name in its own configuration.
 */
export function installProductGuides(apiKey: string = PENDO_API_KEY) {
  if (!apiKey || document.getElementById(PENDO_SCRIPT_ID)) {
    return;
  }

  window.pendo = window.pendo ?? _createAgentStub();
  const script = document.createElement('script');

  script.id = PENDO_SCRIPT_ID;
  script.src = `https://cdn.pendo.io/agent/static/${apiKey}/pendo.js`;
  script.async = true;

  document.head.appendChild(script);
}

/**
 * Tells the guides who is reading them, so each account sees its own.
 *
 * The account is the visitor's email domain, which is how one company's people
 * are counted together rather than as strangers.
 *
 * @param visitor - The signed-in account: its id and the address it signed in with.
 */
export function identifyForProductGuides(visitor: { id: number | string; email: string }) {
  const domain = visitor.email.split('@').pop()?.trim();

  window.pendo?.initialize?.({
    visitor: { id: visitor.id, email: visitor.email },
    account: { id: domain ?? '' },
  });
}

/**
 * Shows the guide the badge in the navigation stands for.
 *
 * Only a guide the agent launches from its own badge belongs to that row; the
 * rest open on their own terms. An install running no guides reaches nothing.
 */
export function showProductGuides() {
  const guides = window.pendo?.getActiveGuides?.() ?? [];
  guides.find((guide) => guide.launchMethod === 'auto-badge')?.show();
}
