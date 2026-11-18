const fs = require('node:fs');
const path = require('node:path');

const express = require('express');
const expressStaticGzip = require('express-static-gzip');
const morgan = require('morgan');

/*
  Both apps are deployed as one bundle behind one origin. The React app's
  document is the default; the Ember app's is kept under its own name and
  served for the paths the ledger says it still owns.
*/
const staticDir = path.join(__dirname, 'dist');
const REACT_DOCUMENT = path.join(staticDir, 'index.html');
const EMBER_DOCUMENT = path.join(staticDir, 'ember.html');
const EMBER_PATHS_FILE = path.join(__dirname, 'ember-owned-paths.json');

const PORT = Number(process.env.PORT) || 4200;

/*
  The configuration both apps read at boot. None of it is secret: it is served
  to the browser by design, which is why it lives in the environment and not in
  either bundle.
*/
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
 * it has no screen for, so this fails the boot rather than serving a half-app.
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
 * Whether the Ember app answers a path.
 *
 * A path owns what sits under it but not a sibling that merely starts with the
 * same letters, so `/dashboard/projects-overview` is not read as a child of
 * `/dashboard/projects`.
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

/*
  A probe against `/` cannot fail: the catch-all answers every path. This one
  reports on what a release actually risks getting wrong — a bundle that did
  not make it into the image.
*/
app.get('/healthz', function (req, res) {
  const missing = [REACT_DOCUMENT, EMBER_DOCUMENT].filter((file) => !fs.existsSync(file));

  if (missing.length > 0) {
    res.status(503).json({ status: 'unhealthy', missing });

    return;
  }

  res.json({ status: 'ok', emberOwnedPaths: emberOwnedPaths.length });
});

app.get('/runtimeconfig.js', function (req, res) {
  res.type('application/javascript');
  res.send(`var runtimeGlobalConfig=${getRuntimeConfig()};`);
});

/*
  No index: a bare directory must fall through to the catch-all, which decides
  which of the two documents answers it.
*/
app.use(expressStaticGzip(staticDir, { serveStatic: { index: false } }));

/*
  Every path with no file behind it gets one of the two documents, and each
  app's router takes it from there. Only ever one of two fixed files, so no
  request path reaches the disk.
*/
app.use(function (req, res) {
  // lgtm [js/missing-rate-limiting]
  res.sendFile(isEmberOwned(req.path) ? EMBER_DOCUMENT : REACT_DOCUMENT);
});

app.listen(PORT, function () {
  process.stdout.write(`server listening on port ${PORT}\n`);
});
