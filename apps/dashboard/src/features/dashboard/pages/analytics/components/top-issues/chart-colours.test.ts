import { describe, expect, it } from 'vitest';

import {
  getChartColours,
  getChartFontFamily,
  getColourAtOpacity,
  getFadingBarFill,
} from './chart-colours';

describe('getColourAtOpacity', () => {
  it('appends the opacity as the two hex digits a canvas reads', () => {
    expect(getColourAtOpacity('#ff4d3f', 1)).toBe('#ff4d3fff');
    expect(getColourAtOpacity('#ff4d3f', 0)).toBe('#ff4d3f00');
    expect(getColourAtOpacity('#ff4d3f', 0.5)).toBe('#ff4d3f80');
  });

  it('holds an opacity outside the range to the nearest end of it', () => {
    expect(getColourAtOpacity('#ff4d3f', 2)).toBe('#ff4d3fff');
    expect(getColourAtOpacity('#ff4d3f', -1)).toBe('#ff4d3f00');
  });

  it('drops an opacity the colour already carries, rather than adding a second', () => {
    expect(getColourAtOpacity('#ff4d3f80', 1)).toBe('#ff4d3fff');
  });
});

describe('getFadingBarFill', () => {
  it('runs across the bar, since the bars do', () => {
    expect(getFadingBarFill('#ff4d3f')).toMatchObject({ type: 'linear', x: 0, y: 0, x2: 1, y2: 0 });
  });

  it('holds the colour to a fifth of the bar, then clears it by the tip', () => {
    expect(getFadingBarFill('#ff4d3f').colorStops).toEqual([
      { offset: 0, color: '#ff4d3f' },
      { offset: 0.2, color: '#ff4d3f' },
      { offset: 0.9, color: '#ff4d3f00' },
      { offset: 1, color: '#ff4d3f00' },
    ]);
  });
});

describe('getChartColours', () => {
  it('resolves every colour rather than handing over a token name', () => {
    expect(Object.values(getChartColours()).every((colour) => colour.startsWith('#'))).toBe(true);
  });
});

describe('getChartFontFamily', () => {
  it('names a font for the labels', () => {
    expect(getChartFontFamily().length).toBeGreaterThan(0);
  });
});
