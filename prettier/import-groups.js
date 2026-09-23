import * as sortImports from '@ianvs/prettier-plugin-sort-imports';
import ts from 'typescript';

import { importGroupOf, importOrderFor, ownPatternsFor } from './import-order.js';

/*
  Runs the sort plugin, then spaces the import block by how many imports a file has:
  - up to 2 imports: no blank lines, except around a multi-line import
  - 3 to 5 imports: group 1 alone, groups 2–3 together, groups 4–5 together
  - more than 5: all five groups apart
  Standalone `import type` lines go last in their group; mixed imports such as
  `import { value, type Type }` stay on one line. An import that prints across
  several lines sits apart: value imports at the top of their group, type imports
  at the bottom. Side-effect imports that are not
  stylesheets stay where they are, and imports on either side are spaced separately.
*/

/**
 * @typedef {object} ImportEntry
 * @property {string} text - The statement with any comments above it.
 * @property {number} group - Its group, 1 to 5.
 * @property {boolean} isType - Whether it is `import type`.
 * @property {boolean} isMultiline - Whether it prints across several lines.
 * @property {boolean} isBarrier - Whether it is a side-effect import that must not move.
 */

const MERGED_GROUPS = { 1: 1, 2: 2, 3: 2, 4: 4, 5: 4 };

/**
 * Whether Prettier keeps this import on one line however long it is.
 *
 * Prettier only breaks the braces of a named import list with more than one
 * specifier. A default import, a namespace import and a single named specifier
 * are printed on one line and simply overflow printWidth.
 *
 * @param {import('typescript').ImportDeclaration} statement - The import.
 * @returns {boolean} Whether Prettier cannot break it.
 */
function _printsOnOneLine(statement) {
  const bindings = statement.importClause?.namedBindings;

  if (!bindings || !ts.isNamedImports(bindings)) {
    return true;
  }

  return bindings.elements.length < 2;
}

/**
 * Estimates whether Prettier will break an import across lines, by printing it on one line.
 *
 * @param {import('typescript').ImportDeclaration} statement - The import.
 * @param {string} text - The import statement's source text.
 * @param {number} printWidth - The configured print width.
 * @returns {boolean} Whether Prettier breaks it across lines.
 */
function _isMultiline(statement, text, printWidth) {
  if (_printsOnOneLine(statement)) {
    return false;
  }

  const oneLine = text
    .replace(/\s+/g, ' ')
    .replace(/\{ ?/, '{ ')
    .replace(/,? ?\}/, ' }');

  return oneLine.length > printWidth;
}

/**
 * Checks whether an import brings in only types: `import type { A }`, or `import { type A, type B }`.
 *
 * @param {import('typescript').ImportClause | undefined} clause - The import's clause.
 * @returns {boolean} Whether every imported name is a type.
 */
function _importsOnlyTypes(clause) {
  if (!clause) {
    return false;
  }

  if (clause.phaseModifier === ts.SyntaxKind.TypeKeyword) {
    return true;
  }

  const bindings = clause.namedBindings;

  return (
    !clause.name &&
    bindings !== undefined &&
    ts.isNamedImports(bindings) &&
    bindings.elements.length > 0 &&
    bindings.elements.every((element) => element.isTypeOnly)
  );
}

/**
 * Reads the leading import statements of a file.
 *
 * @param {string} code - The sorted file.
 * @param {import('prettier').ParserOptions} options - Prettier options.
 * @returns {{ entries: ImportEntry[], start: number, end: number } | undefined} The imports and the span they cover.
 */
function _readImports(code, options) {
  const sourceFile = ts.createSourceFile(
    options.filepath ?? 'file.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const statements = [];

  for (const statement of sourceFile.statements) {
    // The sort plugin emits a bare `;` ahead of the imports when the file starts with a comment.
    if (ts.isEmptyStatement(statement) && statements.length === 0) {
      continue;
    }

    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      break;
    }

    statements.push(statement);
  }

  if (statements.length === 0) {
    return undefined;
  }

  let previousEnd = statements[0].getStart(sourceFile);

  const entries = statements.map((statement) => {
    const text = code.slice(previousEnd, statement.end).trim();
    const source = statement.moduleSpecifier.text;
    const group = importGroupOf(source, options.importOwnPatterns ?? []);

    previousEnd = statement.end;

    return {
      text,
      group,
      isType: _importsOnlyTypes(statement.importClause),
      isMultiline: _isMultiline(statement, statement.getText(sourceFile), options.printWidth),
      isBarrier: !statement.importClause && group !== 5,
    };
  });

  return { entries, start: statements[0].getStart(sourceFile), end: previousEnd };
}

/**
 * Lays out one group: multi-line value imports first, then one-line value imports, then standalone
 * type imports, with multi-line type imports last. Multi-line imports are set apart.
 *
 * @param {ImportEntry[]} entries - The group's imports, in sorted order.
 * @returns {string[][]} Blocks to join with blank lines.
 */
function _layoutGroup(entries) {
  const top = entries.filter((entry) => entry.isMultiline && !entry.isType);
  const values = entries.filter((entry) => !entry.isMultiline && !entry.isType);
  const types = entries.filter((entry) => !entry.isMultiline && entry.isType);
  const bottom = entries.filter((entry) => entry.isMultiline && entry.isType);

  return [
    ...top.map((entry) => [entry.text]),
    [...values, ...types].map((entry) => entry.text),
    ...bottom.map((entry) => [entry.text]),
  ].filter((block) => block.length > 0);
}

/**
 * Keeps imports in their order, setting any multi-line import apart with blank lines.
 *
 * @param {ImportEntry[]} entries - The imports, in sorted order.
 * @returns {string} The imports, joined with the right blank lines.
 */
function _spaceMultilineInOrder(entries) {
  const blocks = [];

  for (const entry of entries) {
    const previous = blocks.at(-1);

    if (entry.isMultiline || !previous || previous.isMultiline) {
      blocks.push({ isMultiline: entry.isMultiline, lines: [entry.text] });
    } else {
      previous.lines.push(entry.text);
    }
  }

  return blocks.map((block) => block.lines.join('\n')).join('\n\n');
}

/**
 * Spaces a run of sortable imports by the file's import count.
 *
 * @param {ImportEntry[]} entries - The imports between two barriers, in sorted order.
 * @param {number} total - How many imports the file has.
 * @returns {string} The imports, joined with the right blank lines.
 */
function _layoutRun(entries, total) {
  if (total <= 2) {
    return _spaceMultilineInOrder(entries);
  }

  const groupKey = (entry) => (total <= 5 ? MERGED_GROUPS[entry.group] : entry.group);
  const groups = [...new Set(entries.map(groupKey))];

  return groups
    .flatMap((key) => _layoutGroup(entries.filter((entry) => groupKey(entry) === key)))
    .map((block) => block.join('\n'))
    .join('\n\n');
}

/**
 * Rewrites the import block with the spacing rules.
 *
 * @param {string} code - The file after the sort plugin ran.
 * @param {import('prettier').ParserOptions} options - Prettier options.
 * @returns {string} The file with the import block re-spaced.
 */
function _regroupImports(code, options) {
  const imports = _readImports(code, options);

  if (!imports || code.slice(imports.start, imports.end).includes('prettier-ignore')) {
    return code;
  }

  const runs = [[]];

  for (const entry of imports.entries) {
    if (entry.isBarrier) {
      runs.push([entry], []);
    } else {
      runs.at(-1).push(entry);
    }
  }

  const block = runs
    .filter((run) => run.length > 0)
    .map((run) => _layoutRun(run, imports.entries.length))
    .join('\n\n');

  return code.slice(0, imports.start) + block + code.slice(imports.end);
}

export const options = sortImports.options;

export const parsers = Object.fromEntries(
  ['babel', 'babel-ts', 'typescript'].map((name) => {
    const parser = sortImports.parsers[name];

    const preprocess = (code, parserOptions) => {
      const importOwnPatterns = ownPatternsFor(parserOptions.filepath);
      const fileOptions = {
        ...parserOptions,
        importOrder: importOrderFor(importOwnPatterns),
        importOwnPatterns,
      };

      return _regroupImports(parser.preprocess(code, fileOptions), fileOptions);
    };

    return [name, { ...parser, preprocess }];
  })
);
