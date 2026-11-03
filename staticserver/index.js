const fs = require('fs');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const expressStaticGzip = require('express-static-gzip');

const staticDir = path.join(__dirname, 'dist');

/*
  Both apps are built into one directory, which they can share because their
  asset names never collide. Only the entry document does, so the React app
  keeps `index.html` and the Ember app's is saved beside it.
*/
const REACT_DOCUMENT = path.join(staticDir, 'index.html');
const EMBER_DOCUMENT = path.join(staticDir, 'ember.html');

/* Written from the React app's path ledger at build time. */
const EMBER_PATHS_FILE = path.join(__dirname, 'ember-owned-paths.json');

const PORT = Number(process.env.PORT) || 4200;

const ENVs = [
  'IRENE_API_HOST',
  'IRENE_SHOW_LICENSE',
  'IRENE_ENABLE_PENDO',
  'IRENE_ENABLE_MARKETPLACE',
  'IRENE_POSTHOG_API_KEY',
  'IRENE_POSTHOG_API_HOST',
  'ENTERPRISE',
  'WHITELABEL_ENABLED',
  'WHITELABEL_NAME',
  'WHITELABEL_LOGO',
  'WHITELABEL_THEME',
  'WHITELABEL_FAVICON',
];

/**
 * Reads the paths the Ember app still serves.
 *
 * An unreadable list would hand every URL to the React app, including the ones
 * it has no screen for, so it fails the boot instead of serving a half-app.
 *
 * @returns {string[]} The Ember-owned paths, longest first.
 */
function readEmberOwnedPaths() {
  const parsed = JSON.parse(fs.readFileSync(EMBER_PATHS_FILE, 'utf8'));

  if (!Array.isArray(parsed)) {
    throw new TypeError(`${EMBER_PATHS_FILE} is not a list of paths`);
  }

  return parsed.slice().sort((one, other) => other.length - one.length);
}

const emberOwnedPaths = readEmberOwnedPaths();

/**
 * Works out which app answers for a URL.
 *
 * A path matches on a segment boundary, so `/dashboard/project` does not claim
 * `/dashboard/projects-overview`.
 *
 * @param {string} pathname - The path being asked for.
 * @returns {boolean} Whether the Ember app owns it.
 */
function isEmberOwned(pathname) {
  return emberOwnedPaths.some((owned) => pathname === owned || pathname.startsWith(`${owned}/`));
}

/**
 * Builds the configuration both apps read at boot.
 *
 * @returns {string} The configuration as JSON.
 */
function getRuntimeConfig() {
  const content = {};

  for (const env of ENVs) {
    const value = process.env[env];

    if (value) {
      content[env] = value;
    }
  }

  return JSON.stringify(content);
}

const app = express();

app.use(morgan('tiny'));

app.get('/runtimeconfig.js', function (req, res) {
  const config = `var runtimeGlobalConfig=${getRuntimeConfig()};`;

  res.type('application/javascript');
  res.send(config);
});

app.use(
  expressStaticGzip(staticDir, {
    serveStatic: {
      /* The document is chosen below, so a directory must not resolve to one. */
      index: false,
    },
  })
);

/*
  Anything left is a route rather than a file, and each app routes its own.
  Only ever one of two fixed documents, so no request path reaches the disk.
*/
app.use(function (req, res) {
  // lgtm [js/missing-rate-limiting]
  res.sendFile(isEmberOwned(req.path) ? EMBER_DOCUMENT : REACT_DOCUMENT);
});

app.listen(PORT, function () {
  process.stdout.write(`server listening on port ${PORT}\n`);
});
