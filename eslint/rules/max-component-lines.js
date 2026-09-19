/*
  Flags a component file once its code passes a line limit, and tells the
  developer how to split it. Blank and comment-only lines do not count, so
  documenting a component never pushes it over.
*/

/**
 * Counts the lines that hold code. Tokens exclude comments, so a line counts only when a token touches it.
 *
 * @param {import('eslint').SourceCode} sourceCode - The file being linted.
 * @returns {number} The number of lines with code.
 */
function _countCodeLines(sourceCode) {
  const lines = new Set();

  for (const token of sourceCode.ast.tokens) {
    for (let line = token.loc.start.line; line <= token.loc.end.line; line += 1) {
      lines.add(line);
    }
  }

  return lines.size;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Limit the lines of code in a component file' },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
    messages: {
      tooLong:
        'This component file has {{count}} lines of code, over the limit of {{max}}. ' +
        'Break it into smaller components: move self-contained sections into their own folder under components/, ' +
        'and extract state and data logic into hooks.',
    },
  },

  create(context) {
    const max = context.options[0]?.max ?? 350;

    return {
      'Program:exit'() {
        const { sourceCode } = context;
        const count = _countCodeLines(sourceCode);

        if (count > max) {
          const lastLine = sourceCode.lines.length;

          context.report({
            // Spans the whole file, so the editor underlines all of it.
            loc: {
              start: { line: 1, column: 0 },
              end: { line: lastLine, column: sourceCode.lines[lastLine - 1].length },
            },
            messageId: 'tooLong',
            data: { count: String(count), max: String(max) },
          });
        }
      },
    };
  },
};
