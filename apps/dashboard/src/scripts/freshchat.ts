/*
  Freshchat ships a script rather than a package: the widget is installed by
  dropping its tag on the page, and everything afterwards goes through the
  `fcWidget` object it defines. There is no React SDK, so the installer is here.
*/

/** What the widget's own user record holds, as the widget reports it. */
interface FreshchatUserResponse {
  status: number;
  data?: { restoreId?: string | null };
}

interface FreshchatWidget {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  destroy: () => void;
  on: (event: string, handler: (response: FreshchatUserResponse) => void) => void;
  user: {
    get: (handler: (response: FreshchatUserResponse) => void) => void;
    create: (user: Record<string, string | undefined>) => void;
    setProperties: (properties: Record<string, string | undefined>) => void;
  };
}

declare global {
  interface Window {
    fcWidget?: FreshchatWidget;
    fcSettings?: Record<string, unknown>;
    fcWidgetMessengerConfig?: Record<string, unknown>;
  }
}

/** Who the conversation belongs to, so support sees who is asking and from where. */
export interface FreshchatIdentity {
  firstName: string;
  lastName: string;
  email: string;
  organizationName: string;

  /** The account's own id with Freshchat, which restores a conversation across devices. */
  hash: string;
}

const FRESHCHAT_HOST = 'https://appknox-support.freshchat.com';
const SCRIPT_ID = 'freshchat-widget';

/**
 * Whether the widget has finished installing.
 *
 * @returns Whether `fcWidget` is there to be called.
 */
const isInstalled = () => typeof window.fcWidget === 'object';

/**
 * Reads the conversation this account was last in, so it is restored rather than started again.
 *
 * Storage can throw where site data is blocked, and a chat that starts fresh is
 * a better outcome than a navigation that fails.
 *
 * @param hash - The account's own id with Freshchat.
 * @returns The stored conversation id, or null where there is none.
 */
function readRestoreId(hash: string): string | null {
  try {
    return window.localStorage.getItem(hash);
  } catch {
    return null;
  }
}

/**
 * Remembers the conversation, so the next visit continues it.
 *
 * @param hash - The account's own id with Freshchat.
 * @param restoreId - What the widget gave back for this account.
 */
function storeRestoreId(hash: string, restoreId: string) {
  try {
    window.localStorage.setItem(hash, restoreId);
  } catch {
    /* A tab that cannot store it simply starts a new conversation next time. */
  }
}

/**
 * Tells the widget who is asking, and remembers the conversation it answers with.
 *
 * @param identity - The account the conversation belongs to.
 */
function identify(identity: FreshchatIdentity) {
  const widget = window.fcWidget;

  if (!widget) {
    return;
  }

  const company = { cf_custom_company_name: identity.organizationName };

  widget.user.get((response) => {
    if (response.status !== 200) {
      widget.user.create({
        firstName: identity.firstName,
        lastName: identity.lastName,
        email: identity.email,
        ...company,
      });

      return;
    }

    if (response.data?.restoreId) {
      storeRestoreId(identity.hash, response.data.restoreId);
    }

    widget.user.setProperties(company);
  });

  widget.on('user:created', (response) => {
    if (response.status !== 200) {
      return;
    }

    widget.user.setProperties(company);

    if (response.data?.restoreId) {
      storeRestoreId(identity.hash, response.data.restoreId);
    }
  });
}

/**
 * Installs the chat widget, once, with its launcher hidden.
 *
 * The navigation opens it instead, so support is reached from the same list as
 * everything else rather than from a bubble floating over the page.
 *
 * @param key - The install's Freshchat key, which is empty where chat is off.
 * @param identity - The account the conversation belongs to.
 */
export function installFreshchat(key: string, identity: FreshchatIdentity) {
  if (!key || document.getElementById(SCRIPT_ID)) {
    return;
  }

  window.fcSettings = {
    host: FRESHCHAT_HOST,
    token: key,
    onInit: () => identify(identity),
  };

  window.fcWidgetMessengerConfig = {
    config: { headerProperty: { hideChatButton: true } },
    externalId: identity.hash,
    restoreId: readRestoreId(identity.hash),
  };

  const script = document.createElement('script');

  script.id = SCRIPT_ID;
  script.src = `${FRESHCHAT_HOST}/js/widget.js`;
  script.async = true;

  document.head.appendChild(script);
}

/** Opens the chat, or closes it where it is already open. */
export function toggleFreshchat() {
  const widget = window.fcWidget;

  if (!isInstalled() || !widget) {
    return;
  }

  if (widget.isOpen()) {
    widget.close();

    return;
  }

  widget.open();
}

/** Closes the chat, for a click that moves the page on to something else. */
export function closeFreshchat() {
  if (!isInstalled() || !window.fcWidget?.isOpen()) {
    return;
  }

  window.fcWidget.close();
}

/** Closes the chat and removes the widget, for an account that signs out. */
export function destroyFreshchat() {
  if (!isInstalled()) {
    return;
  }

  window.fcWidget?.destroy();
}
