/*
  The five import groups, in order:
  1. third-party packages
  2. other workspace packages
  3. this package's own modules by absolute path
  4. this package's own modules by relative path
  5. stylesheets
*/

export const STYLES = String.raw`(\.s?css$|^@irene/ui/styles($|/))`;

const NOT_STYLES = `(?!.*${STYLES})`;

/**
 * Builds the sort plugin's `importOrder` for one workspace. `import-groups.js` moves standalone type imports last.
 *
 * @param {string[]} ownPatterns - Specifiers that refer to the workspace itself, e.g. `@irene/api` or the `@/` alias.
 * @returns {string[]} The `importOrder` option.
 */
export function importOrderFor(ownPatterns) {
  // The plugin takes the first group that matches, so the workspace group must skip this package's own name.
  const own = ownPatterns.length > 0 ? `^(${ownPatterns.join('|')})` : '';
  const notOwn = own ? `(?!${ownPatterns.join('|')})` : '';
  const ownGroup = own ? [`${own}${NOT_STYLES}`, ''] : [];

  return [
    '<BUILTIN_MODULES>',
    '<THIRD_PARTY_MODULES>',
    '',
    `^${NOT_STYLES}${notOwn}@irene/`,
    '',
    ...ownGroup,
    `^[.]${NOT_STYLES}`,
    '',
    STYLES,
  ];
}

/**
 * Works out which of the five groups an import belongs to.
 *
 * @param {string} source - The import's module specifier.
 * @param {string[]} ownPatterns - Specifiers that refer to the workspace itself.
 * @returns {1 | 2 | 3 | 4 | 5} The group number.
 */
export function importGroupOf(source, ownPatterns) {
  if (new RegExp(STYLES).test(source)) {
    return 5;
  }

  if (source.startsWith('.')) {
    return 4;
  }

  if (ownPatterns.length > 0 && new RegExp(`^(${ownPatterns.join('|')})`).test(source)) {
    return 3;
  }

  return source.startsWith('@irene/') ? 2 : 1;
}

const PACKAGE_DIR = /(^|[\\/])packages[\\/]([^\\/]+)[\\/]/;
const APP_DIR = /(^|[\\/])apps[\\/][^\\/]+[\\/]/;

/**
 * Works out the specifiers a file's own workspace uses, from where the file lives.
 * A package folder is named after its package, so `packages/api` is `@irene/api`; apps use the `@/` alias.
 *
 * @param {string | undefined} filepath - The file being formatted.
 * @returns {string[]} Patterns for the workspace's own imports; empty outside apps and packages.
 */
export function ownPatternsFor(filepath) {
  const packageName = filepath ? PACKAGE_DIR.exec(filepath)?.[2] : undefined;

  if (packageName) {
    return [`@irene/${packageName}(/|$)`, '@tests/'];
  }

  return filepath && APP_DIR.test(filepath) ? ['@/', '@tests/'] : [];
}
