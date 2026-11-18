/*
  The vendored Ember app lints and formats itself, with its own config and its
  own dependencies. Running this repo's linters over it rewrites 5,000 files to
  a style its upstream does not use, and its stylelint config extends packages
  that only exist under its own node_modules, so the run fails outright.

  Patterns without a slash are matched against the basename, so a path-based
  glob cannot express this. The files are filtered here instead.
*/
const ownedByEmberApp = (file) => file.includes('apps/irene/');

const forThisRepo = (files) => files.filter((file) => !ownedByEmberApp(file));

/**
 * Builds the commands for the files this repo's tooling owns.
 *
 * @param {string[]} files - Everything staged that matched the pattern.
 * @param {string[]} commands - The commands to run, each given the file list.
 * @returns {string[]} The commands to run, or none when nothing is left.
 */
const run = (files, commands) => {
  const owned = forThisRepo(files);

  if (owned.length === 0) {
    return [];
  }

  const list = owned.map((file) => JSON.stringify(file)).join(' ');

  return commands.map((command) => `${command} ${list}`);
};

export default {
  '*.{ts,tsx,js,jsx}': (files) =>
    run(files, ['eslint --fix', 'prettier --write', 'eslint --max-warnings=0']),

  '*.{css,scss}': (files) =>
    run(files, ['stylelint --fix', 'prettier --write', 'stylelint --max-warnings=0']),

  '*.{json,md,html}': (files) => run(files, ['prettier --write']),
};
