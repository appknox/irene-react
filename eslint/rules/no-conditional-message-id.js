/*
  Flags a ternary handed to akMT() as its message id. Each branch names a
  message the extractor must be able to find by reading the call, and a reader
  comparing two ids has to hold both strings in mind to see what differs.
  Branching on the translated text keeps each id next to its own call.
*/

/** The translation helpers whose first argument is a message id. */
const MESSAGE_FUNCTIONS = new Set(['akMT']);

/**
 * Rewrites `akMT(test ? a : b)` as `test ? akMT(a) : akMT(b)`.
 *
 * @param {import('eslint').Rule.RuleContext} context - The rule's context, read for the source text.
 * @param {import('estree').CallExpression} call - The call being reported.
 * @param {import('estree').ConditionalExpression} id - Its first argument.
 * @returns {(fixer: import('eslint').Rule.RuleFixer) => import('eslint').Rule.Fix} The fix.
 */
function _hoistConditional(context, call, id) {
  const { sourceCode } = context;
  const name = call.callee.name;

  const test = sourceCode.getText(id.test);
  const consequent = sourceCode.getText(id.consequent);
  const alternate = sourceCode.getText(id.alternate);

  return (fixer) =>
    fixer.replaceText(call, `${test} ? ${name}(${consequent}) : ${name}(${alternate})`);
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Branch on the translated text, not on the message id' },
    fixable: 'code',
    schema: [],
    messages: {
      conditionalId:
        '{{name}}() takes one message id, not a choice between two. ' +
        "Branch on the call instead: condition ? {{name}}('a') : {{name}}('b').",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        if (!MESSAGE_FUNCTIONS.has(node.callee.name)) {
          return;
        }

        const [id] = node.arguments;

        if (id?.type !== 'ConditionalExpression') {
          return;
        }

        context.report({
          node: id,
          messageId: 'conditionalId',
          data: { name: node.callee.name },

          // Values would have to be duplicated into both branches, so leave those to the developer.
          fix: node.arguments.length === 1 ? _hoistConditional(context, node, id) : null,
        });
      },
    };
  },
};
