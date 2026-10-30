// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type OrganizationModel from 'irene/models/organization';
import type UserModel from 'irene/models/user';

/**
 * Adds a script tag once per page.
 *
 * A second copy of a widget wraps the first's hold on the global it patched,
 * and the two then call each other until the stack runs out. The React app
 * installs the same chat widget, so either side may have got there first.
 *
 * @param src - The script to load.
 * @returns Whether it was added, false when it is already there.
 */
const injectScriptOnce = (src: string) => {
  if (document.querySelector(`script[src="${src}"]`)) {
    return false;
  }

  const s = document.createElement('script');

  s.src = src;
  s.async = 1;

  document.getElementsByTagName('head')[0].appendChild(s);

  return true;
};

// Inject freshdesk support script that enables widget in the application
const injectSupportWidget = (widgetId: string) => {
  // Widget launch
  window.fwSettings = { widget_id: widgetId };

  /* A stand-in that queues calls made before the widget's own script loads. */
  if ('function' != typeof window.FreshworksWidget) {
    // eslint-disable-next-line no-var
    var n = function () {
      // eslint-disable-next-line prefer-rest-params
      n.q.push(arguments);
    };

    n.q = [];
    window.FreshworksWidget = n;
  }

  injectScriptOnce(`https://ind-widget.freshworks.com/widgets/${widgetId}.js`);
};

// Install freshchat
const installFreshChat = (
  user: UserModel,
  org: OrganizationModel | null,
  freshchatKey: string
) => {
  const host = 'https://appknox-support.freshchat.com';

  window.fcSettings = {
    host,
    token: freshchatKey,
    onInit: function () {
      window.fcWidget.user.get(function (resp) {
        const status = resp && resp.status;
        const data = resp && resp.data;

        if (status !== 200) {
          window.fcWidget.user.create({
            firstName: user?.firstName, // user's first name
            lastName: user?.lastName, // user's last name
            email: user.email, // user's email address
            cf_custom_company_name: org?.name,
          });
        }

        if (status === 200 && data?.restoreId) {
          window.localStorage.setItem(user.freshchatHash, data?.restoreId);

          window.fcWidget?.user?.setProperties({
            cf_custom_company_name: org?.name,
          });
        }
      });

      window.fcWidget.on('user:created', function (resp) {
        const status = resp && resp.status;
        const data = resp && resp.data;

        if (status === 200) {
          window.fcWidget?.user?.setProperties({
            cf_custom_company_name: org?.name,
          });

          if (data?.restoreId) {
            // Save Restore ID to DB
            window.localStorage.setItem(user.freshchatHash, data.restoreId);
          }
        }
      });
    },
  };

  const restoreId = window.localStorage.getItem(user.freshchatHash); // GET Restore ID from DB

  window.fcWidgetMessengerConfig = {
    config: {
      headerProperty: {
        hideChatButton: true,
      },
    },
    externalId: user.freshchatHash,
    restoreId,
  };

  injectScriptOnce(`${host}/js/widget.js`);
};

export { injectSupportWidget, installFreshChat };
