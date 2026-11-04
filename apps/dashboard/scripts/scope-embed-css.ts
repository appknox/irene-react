/*
  Makes the design system's own stylesheet safe to load inside a host page.

  The stylesheet is built from `@irene/ui/styles` unchanged, so the components
  are drawn with exactly what they are drawn with in this app. Two things then
  have to be true for it to work in someone else's document, and neither can be
  expressed in the source:

  1. Nothing may stay in a cascade layer. A host's stylesheets are usually
     unlayered, and unlayered CSS wins over layered CSS whatever the
     specificity — so layered utilities would lose to the host's reset and
     draw nothing.

  2. The base layer's *document* rules may not apply to the host's document.
     `html { font-size: 14px }` would rescale every page the host renders, so
     those are pointed at the mounted element instead.

     Its element rules are left alone. They have to be: a drawer, a menu or a
     date picker renders through a portal into `document.body`, outside the
     mounted element, and a scoped reset would never reach it — form controls
     there would keep the browser's own borders and fonts. The host already
     ships an equivalent reset, so applying this one document-wide changes
     little, where confining it visibly breaks everything that portals.
*/
import { readFileSync, writeFileSync } from 'node:fs';

/** What the host marks the element it mounts into with. */
const MOUNT_SCOPE = ':where([data-react-root])';

/*
  What a utility rule is confined to: what this app renders, and what it renders
  through a portal. The host's own markup uses names of its own that these would
  otherwise take over — `mb-2`, `flex` and `hidden` are its classes too.

  `:where()` adds no specificity, so a utility still weighs what it weighs
  against anything else inside the mount.
*/
const UTILITY_SCOPE = ':where([data-react-root],[data-slot])';

/** Selectors meaning "the document", which become the mounted element instead. */
const DOCUMENT_SELECTORS = new Set(['html', 'body', ':host', ':root']);

/**
 * Finds the end of a brace-delimited block.
 *
 * @param css - The stylesheet.
 * @param openingBrace - The index of the block's `{`.
 * @returns The index just past the block's `}`.
 */
function endOfBlock(css: string, openingBrace: number): number {
  let depth = 0;

  for (let cursor = openingBrace; cursor < css.length; cursor += 1) {
    if (css[cursor] === '{') {
      depth += 1;
    }

    if (css[cursor] === '}') {
      depth -= 1;
    }

    if (depth === 0) {
      return cursor + 1;
    }
  }

  return css.length;
}

/**
 * Splits a selector list on its top-level commas.
 *
 * @param selectors - The selector list.
 * @returns One selector per entry.
 */
function splitSelectors(selectors: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (const character of selectors) {
    if (character === '(') {
      depth += 1;
    }

    if (character === ')') {
      depth -= 1;
    }

    if (character === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += character;
    }
  }

  parts.push(current);

  return parts;
}

/**
 * Points a rule meant for the document at the mounted element.
 *
 * Everything else is left as written, so it still reaches what this app
 * renders through a portal.
 *
 * @param selector - The selector as written.
 * @returns The selector, pointed at the mount where it named the document.
 */
function scopeSelector(selector: string): string {
  const trimmed = selector.trim();

  return DOCUMENT_SELECTORS.has(trimmed) ? MOUNT_SCOPE : trimmed;
}

/**
 * Confines a utility to what this app renders.
 *
 * Written twice: once for what the mount and the portals contain, and once for
 * a portal's own root, which carries the class itself rather than inheriting it
 * from an ancestor.
 *
 * @param selector - The selector as written.
 * @returns The selector, confined to this app.
 */
function confineSelector(selector: string): string {
  const trimmed = selector.trim();

  return `${UTILITY_SCOPE} ${trimmed},[data-slot]${trimmed}`;
}

/**
 * Scopes every rule in a block, following nested at-rules into their bodies.
 *
 * @param css - The block's contents.
 * @param rewrite - What to do with each selector.
 * @returns The contents, with every selector scoped.
 */
function scopeRules(css: string, rewrite: (selector: string) => string = scopeSelector): string {
  let result = '';
  let cursor = 0;

  while (cursor < css.length) {
    const brace = css.indexOf('{', cursor);

    if (brace === -1) {
      result += css.slice(cursor);
      break;
    }

    const head = css.slice(cursor, brace);
    const blockEnd = endOfBlock(css, brace);
    const body = css.slice(brace + 1, blockEnd - 1);

    if (head.trimStart().startsWith('@')) {
      /* A nested at-rule: its own body holds the rules to scope. */
      const isConditional = /^@(media|supports|container|layer)/.test(head.trim());

      result += `${head}{${isConditional ? scopeRules(body, rewrite) : body}}`;
    } else {
      result += `${splitSelectors(head).map(rewrite).join(',')}{${body}}`;
    }

    cursor = blockEnd;
  }

  return result;
}

/**
 * A layer's rules, rewritten for the host's document.
 *
 * @param layer - The layer's name.
 * @param body - Its rules.
 * @returns The rules, scoped as that layer needs.
 */
function unwrap(layer: string, body: string): string {
  if (layer === 'base') {
    return scopeRules(body);
  }

  /* Named classes, which the host has its own meanings for. */
  if (layer === 'utilities' || layer === 'components') {
    return scopeRules(body, confineSelector);
  }

  return body;
}

/**
 * Rewrites the built stylesheet so a host page can load it.
 *
 * Unwraps every cascade layer, pointing the base layer's document rules at the
 * mount and confining the named classes to what this app renders.
 *
 * @param css - The built stylesheet.
 * @returns The stylesheet, unlayered and scoped.
 */
export function scopeEmbedCss(css: string): string {
  /* The layer order statement means nothing once no layers are left. */
  let result = css.replace(/@layer\s+[\w-]+(\s*,\s*[\w-]+)+\s*;/g, '');
  let opening = /@layer\s+([\w-]+)\s*\{/.exec(result);

  while (opening) {
    const brace = opening.index + opening[0].length - 1;
    const blockEnd = endOfBlock(result, brace);
    const body = result.slice(brace + 1, blockEnd - 1);
    const layer = opening[1];

    result = result.slice(0, opening.index) + unwrap(layer, body) + result.slice(blockEnd);

    opening = /@layer\s+([\w-]+)\s*\{/.exec(result);
  }

  return result;
}

/* Only when run as the build step, so the rewrite above can be tested on its own. */
if (process.argv[1]?.endsWith('scope-embed-css.ts')) {
  const [stylesheet] = process.argv.slice(2);

  if (!stylesheet) {
    throw new Error('Usage: scope-embed-css.ts <stylesheet>');
  }

  writeFileSync(stylesheet, scopeEmbedCss(readFileSync(stylesheet, 'utf8')), 'utf8');
}
