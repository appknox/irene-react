import { STYLES } from './prettier/import-order.js';

/** @type {import('prettier').Config & import('@ianvs/prettier-plugin-sort-imports').PluginConfig} */
export default {
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 100,

  // Sorts and spaces imports, working out each file's own workspace from its path. See prettier/.
  plugins: ['./prettier/import-groups.js'],
  // Stylesheets have no side effects on other imports, so they can move to the bottom.
  importOrderSafeSideEffects: [STYLES],
  // Keeps `import { value, type Type }` on one line; only imports with nothing but types stand alone.
  importOrderTypeScriptVersion: '5.0.0',
};
