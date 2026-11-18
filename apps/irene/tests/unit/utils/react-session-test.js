import { module, test } from 'qunit';

import { adoptReactSession, syncReactSession } from 'irene/utils/react-session';

const REACT_KEY = 'irene:auth-session';
const EMBER_KEY = 'ember_simple_auth-session';

function read(key) {
  const stored = window.localStorage.getItem(key);

  return stored ? JSON.parse(stored) : null;
}

module('Unit | Utility | react-session', function (hooks) {
  hooks.beforeEach(function () {
    window.localStorage.removeItem(REACT_KEY);
    window.localStorage.removeItem(EMBER_KEY);
  });

  hooks.afterEach(function () {
    window.localStorage.removeItem(REACT_KEY);
    window.localStorage.removeItem(EMBER_KEY);
  });

  module('syncReactSession', function () {
    test('it writes the session under the key the React app reads', function (assert) {
      syncReactSession({ token: 'tok-1', user_id: 42, b64token: 'b64-1' });

      assert.deepEqual(read(REACT_KEY), {
        token: 'tok-1',
        userId: 42,
        b64token: 'b64-1',
      });
    });

    test('it removes the session when this app gives one up', function (assert) {
      syncReactSession({ token: 'tok-1', user_id: 42, b64token: 'b64-1' });
      syncReactSession(null);

      assert.strictEqual(read(REACT_KEY), null);
    });

    test('it removes the session when there is no credential to share', function (assert) {
      syncReactSession({ token: 'tok-1', user_id: 42, b64token: 'b64-1' });
      syncReactSession({ token: 'tok-1', user_id: 42 });

      assert.strictEqual(read(REACT_KEY), null);
    });

    test('it replaces a session left by an earlier sign-in', function (assert) {
      syncReactSession({ token: 'old', user_id: 1, b64token: 'b64-old' });
      syncReactSession({ token: 'new', user_id: 2, b64token: 'b64-new' });

      assert.strictEqual(read(REACT_KEY).userId, 2);
    });
  });

  module('adoptReactSession', function () {
    test('it takes the React session when this app has none', function (assert) {
      window.localStorage.setItem(
        REACT_KEY,
        JSON.stringify({ token: 'tok-1', userId: 42, b64token: 'b64-1' })
      );

      adoptReactSession();

      assert.deepEqual(read(EMBER_KEY), {
        authenticated: {
          authenticator: 'authenticator:login',
          token: 'tok-1',
          user_id: 42,
          b64token: 'b64-1',
        },
      });
    });

    test("it leaves this app's own session alone", function (assert) {
      const own = {
        authenticated: {
          authenticator: 'authenticator:saml2',
          token: 'mine',
          user_id: 7,
          b64token: 'b64-mine',
        },
      };

      window.localStorage.setItem(EMBER_KEY, JSON.stringify(own));
      window.localStorage.setItem(
        REACT_KEY,
        JSON.stringify({ token: 'theirs', userId: 42, b64token: 'b64-theirs' })
      );

      adoptReactSession();

      assert.deepEqual(read(EMBER_KEY), own);
    });

    test('it takes nothing when neither app is signed in', function (assert) {
      adoptReactSession();

      assert.strictEqual(read(EMBER_KEY), null);
    });

    test('it refuses an entry missing the fields a session needs', function (assert) {
      window.localStorage.setItem(
        REACT_KEY,
        JSON.stringify({ token: 'tok-1', userId: '42', b64token: 'b64-1' })
      );

      adoptReactSession();

      assert.strictEqual(read(EMBER_KEY), null);
    });

    test('it refuses an entry that is not valid JSON', function (assert) {
      window.localStorage.setItem(REACT_KEY, 'not json');

      adoptReactSession();

      assert.strictEqual(read(EMBER_KEY), null);
    });
  });
});
