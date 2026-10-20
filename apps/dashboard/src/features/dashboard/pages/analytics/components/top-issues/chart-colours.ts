import { getCSSVariableValue } from '@irene/ui/css-variable';

/** The colours this chart paints with, resolved because a canvas resolves no variable. */
export const getChartColours = () => ({
  primary: getCSSVariableValue('--color-primary', '#fe4d3f'),
  foreground: getCSSVariableValue('--color-foreground', '#171717'),
  muted: getCSSVariableValue('--color-foreground-muted', '#7b7b7b'),
  border: getCSSVariableValue('--color-border', '#e9e9e9'),
  background: getCSSVariableValue('--color-background', '#ffffff'),
});

/** The font the labels are drawn in, which is the page's own. */
export const getChartFontFamily = () =>
  getCSSVariableValue('--font-sans', 'ui-sans-serif, system-ui, sans-serif');

/**
 * A colour at a given opacity.
 *
 * @param colour - A six-digit hex colour.
 * @param opacity - How opaque to make it, from 0 to 1.
 * @returns The colour as eight-digit hex.
 */
export function getColourAtOpacity(colour: string, opacity: number) {
  const opacityChannel = Math.round(Math.min(Math.max(opacity, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0');

  return `${colour.slice(0, 7)}${opacityChannel}`;
}

/**
 * A fill that fades out along a bar, full at its base and clear at its tip.
 *
 * @param colour - The colour to draw in.
 * @returns The gradient, in the shape an option accepts.
 */
export const getFadingBarFill = (colour: string) => ({
  type: 'linear',
  x: 0,
  y: 0,
  x2: 1,
  y2: 0,
  colorStops: [
    { offset: 0, color: colour },
    { offset: 0.2, color: colour },
    { offset: 0.9, color: getColourAtOpacity(colour, 0) },
    { offset: 1, color: getColourAtOpacity(colour, 0) },
  ],
});
