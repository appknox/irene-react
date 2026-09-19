import jsx from '@svgr/plugin-jsx';
import svgo from '@svgr/plugin-svgo';
import svgr from 'vite-plugin-svgr';
import type { Plugin } from 'vite';

/**
 * Turns `import Icon from '@irene/ui/svgs/name.svg?react'` into a React component. Props such as `className`
 * and `width` pass through to the `<svg>`. Import `?url` instead for large background images.
 *
 * @returns The Vite plugin.
 */
export function svgrPlugin(): Plugin {
  return svgr({
    include: '**/*.svg?react',
    svgrOptions: {
      plugins: [svgo, jsx],
      svgoConfig: {
        plugins: [
          // Keeps viewBox so the SVG still scales when a width or height is passed.
          { name: 'preset-default', params: { overrides: { removeViewBox: false } } },
          // Prefixes ids with the file name, so two different SVGs on one page cannot clash.
          'prefixIds',
        ],
      },
    },
  });
}
