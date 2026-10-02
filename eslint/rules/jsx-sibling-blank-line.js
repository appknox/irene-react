/*
  Requires a blank line between two element children written on separate lines.
  Without one the children run together in the source and the reader has to parse
  the tags to find where one ends and the next begins.
*/

/**
 * Decides whether a child is an element rather than text or an expression.
 *
 * @param {import('estree-jsx').JSXChild} child - The child to classify.
 * @returns {boolean} True for an element or a fragment.
 */
function _isElement(child) {
  return child.type === 'JSXElement' || child.type === 'JSXFragment';
}

/**
 * Reads the source between two children, which is the whitespace and text JSX
 * either renders or trims away.
 *
 * @param {import('eslint').SourceCode} sourceCode - The source under lint.
 * @param {import('estree-jsx').JSXChild} previous - The child on the left.
 * @param {import('estree-jsx').JSXChild} next - The child on the right.
 * @returns {string} The text between the two.
 */
function _gap(sourceCode, previous, next) {
  return sourceCode.getText().slice(previous.range[1], next.range[0]);
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'layout',
    docs: { description: 'Separate element children with a blank line' },
    fixable: 'whitespace',
    schema: [],
    messages: {
      missingBlankLine: 'Put a blank line between these two children.',
    },
  },

  create(context) {
    const { sourceCode } = context;

    return {
      'JSXElement, JSXFragment'(node) {
        const children = node.children.filter(
          (child) => _isElement(child) || sourceCode.getText(child).trim() !== ''
        );

        for (const [index, next] of children.entries()) {
          const previous = children[index - 1];

          if (!previous || !_isElement(previous) || !_isElement(next)) {
            continue;
          }

          const gap = _gap(sourceCode, previous, next);

          /* Two children sharing a line are deliberately inline, and the space between them is rendered. */
          if (!gap.includes('\n')) {
            continue;
          }

          if (gap.split('\n').length > 2) {
            continue;
          }

          context.report({
            node: next,
            messageId: 'missingBlankLine',
            fix: (fixer) => fixer.insertTextAfter(previous, '\n'),
          });
        }
      },
    };
  },
};
