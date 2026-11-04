import { describe, expect, it } from 'vitest';
import { scopeEmbedCss } from './scope-embed-css';

describe('scopeEmbedCss', () => {
  describe('cascade layers', () => {
    /* A host's own styles are unlayered, and unlayered beats layered whatever
       the specificity, so anything left in a layer would draw nothing. */
    it('leaves no layer behind, whatever it is named', () => {
      const css = scopeEmbedCss(
        '@layer theme,base,components,utilities;@layer theme{:root{--a:1px}}@layer utilities{.p-1{padding:1px}}'
      );

      expect(css).not.toContain('@layer');
    });

    it('drops the layer order statement, which means nothing once they are gone', () => {
      expect(scopeEmbedCss('@layer theme, base, utilities;')).toBe('');
    });

    it('keeps the rules of a layer it has no special treatment for', () => {
      expect(scopeEmbedCss('@layer theme{.x{color:red}}')).toContain('.x{color:red}');
    });

    it('unwraps a layer nested inside another', () => {
      const css = scopeEmbedCss('@layer base{@layer inner{html{font-size:14px}}}');

      expect(css).not.toContain('@layer');
    });
  });

  describe('the base layer', () => {
    /* `html{font-size:14px}` applied to the host's document rescales its pages. */
    it.each(['html', 'body', ':root', ':host'])('points %s at the mount', (selector) => {
      const css = scopeEmbedCss(`@layer base{${selector}{font-size:14px}}`);

      expect(css).toBe(':where([data-react-root]){font-size:14px}');
    });

    /* A drawer or a date picker renders into document.body, outside the mount,
       and a scoped reset would never reach it. */
    it('leaves element rules alone, so what renders through a portal keeps them', () => {
      const css = scopeEmbedCss('@layer base{button,input{border:0}}');

      expect(css).toBe('button,input{border:0}');
    });

    it('scopes the document selector in a list without touching its neighbours', () => {
      const css = scopeEmbedCss('@layer base{html,button{margin:0}}');

      expect(css).toBe(':where([data-react-root]),button{margin:0}');
    });

    it('carries custom properties declared on the document across to the mount', () => {
      const css = scopeEmbedCss('@layer base{:root{--spacing:4px}}');

      expect(css).toContain('--spacing:4px');
      expect(css).toContain('[data-react-root]');
    });
  });

  describe('the named classes', () => {
    /* The host's markup uses `mb-2`, `flex` and `hidden` for its own styling. */
    it('confines a utility to what this app renders', () => {
      const css = scopeEmbedCss('@layer utilities{.mb-2{margin-bottom:8px}}');

      expect(css).toBe(
        ':where([data-react-root],[data-slot]) .mb-2,[data-slot].mb-2{margin-bottom:8px}'
      );
    });

    it('confines component classes the same way', () => {
      expect(scopeEmbedCss('@layer components{.card{padding:1px}}')).toContain(
        ':where([data-react-root],[data-slot]) .card'
      );
    });

    /* A portal's root carries the class itself rather than inheriting it. */
    it('matches a portal root that carries the class itself', () => {
      expect(scopeEmbedCss('@layer utilities{.flex{display:flex}}')).toContain(
        '[data-slot].flex{display:flex}'
      );
    });

    it('confines every selector in a list', () => {
      const css = scopeEmbedCss('@layer utilities{.a,.b{color:red}}');

      expect(css).toContain(':where([data-react-root],[data-slot]) .a');
      expect(css).toContain(':where([data-react-root],[data-slot]) .b');
    });

    it('leaves no utility applying to the whole document', () => {
      const css = scopeEmbedCss('@layer utilities{.mb-2{margin-bottom:8px}.flex{display:flex}}');

      expect(css).not.toMatch(/(^|})\.(mb-2|flex)\{/);
    });
  });

  describe('at-rules', () => {
    it.each(['media (min-width:40rem)', 'supports (display:grid)', 'container (min-width:1px)'])(
      'follows @%s into its body',
      (condition) => {
        const css = scopeEmbedCss(`@layer base{@${condition}{html{font-size:14px}}}`);

        expect(css).toContain(':where([data-react-root]){font-size:14px}');
      }
    );

    it('confines utilities inside a conditional at-rule', () => {
      const css = scopeEmbedCss('@layer utilities{@media print{.mb-2{margin:0}}}');

      expect(css).toContain(':where([data-react-root],[data-slot]) .mb-2');
    });

    /* `from`/`to` are steps, not selectors, and `@font-face` has none at all. */
    it('leaves keyframe steps as written', () => {
      const css = scopeEmbedCss('@layer utilities{@keyframes spin{from{opacity:0}to{opacity:1}}}');

      expect(css).toContain('from{opacity:0}');
      expect(css).toContain('to{opacity:1}');
    });

    it('leaves a font face as written', () => {
      const css = scopeEmbedCss("@layer base{@font-face{font-family:'X';src:url(x.woff2)}}");

      expect(css).toContain("font-family:'X'");
      expect(css).not.toContain('data-react-root');
    });
  });

  describe('selectors it must not misread', () => {
    it('keeps a comma inside :is() with its selector', () => {
      const css = scopeEmbedCss('@layer utilities{.a:is(.b,.c){color:red}}');

      expect(css).toContain(':where([data-react-root],[data-slot]) .a:is(.b,.c)');
      expect(css).not.toContain('.c){color:red}'.replace('.c)', ') .c)'));
    });

    it('keeps an attribute selector whole', () => {
      const css = scopeEmbedCss('@layer utilities{[data-slot="x"]{color:red}}');

      expect(css).toContain('[data-slot="x"]');
    });

    it('leaves a stylesheet with no layers untouched', () => {
      expect(scopeEmbedCss('.a{color:red}')).toBe('.a{color:red}');
    });

    it('answers an empty stylesheet with an empty one', () => {
      expect(scopeEmbedCss('')).toBe('');
    });
  });
});
