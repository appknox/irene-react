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
          {
            name: 'preset-default',
            params: {
              overrides: {
                // Keeps viewBox so the SVG still scales when a width or height is passed.
                removeViewBox: false,

                /*
                  `convertTransform` rounds a transform to three decimals for a
                  translate and five for everything else, which suits coordinates
                  in the tens. An artwork that places a raster through a pattern
                  works in fractions of the image's own pixel size instead:
                  0.000244141 covers 4096px. Rounded to five that reads 0.00024,
                  the raster covers 98.3% of the shape, and a strip of it is left
                  unpainted. Nine decimals is what these exports carry, so the
                  values survive the pass untouched.
                */
                convertTransform: { floatPrecision: 9, transformPrecision: 9 },
              },
            },
          },
          // Prefixes ids with the file name, so two different SVGs on one page cannot clash.
          'prefixIds',
        ],
      },
    },
  });
}
