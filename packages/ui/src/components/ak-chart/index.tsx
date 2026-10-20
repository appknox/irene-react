import * as echarts from 'echarts';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { cn } from '@irene/ui/cn';

/** What a chart is configured with, which is ECharts' own option object. */
export type AkChartOption = echarts.EChartsCoreOption;

interface AkChartProps {
  option: AkChartOption;
  className?: string;
  style?: CSSProperties;
  ariaLabel: string;
}

/**
 * A chart, drawn by ECharts into a canvas this component owns.
 *
 * ECharts draws imperatively into an element it is handed, so the element is
 * kept out of React's way: React renders an empty box and the chart is built
 * into it once it has been laid out, then updated in place as the option
 * changes. It is built from the resize observer rather than on mount, because
 * a box inside a grid measures zero on the first pass and ECharts refuses a
 * zero-sized element.
 *
 * A canvas inherits no stylesheet, so the colours and the font are the
 * caller's to state in the option rather than this component's to apply.
 *
 * @param props.option - What to draw, in ECharts' own option shape.
 * @param props.className - The box's size, which the chart fills.
 * @param props.style - Sizing a class cannot express, such as a measured height.
 * @param props.ariaLabel - What the chart shows, for a reader that cannot see a canvas.
 */
export function AkChart({ option, className, style, ariaLabel }: Readonly<AkChartProps>) {
  const container = useRef<HTMLElement>(null);
  const [chart, setChart] = useState<echarts.ECharts | null>(null);

  // Draws the chart into the canvas.
  useEffect(() => {
    const el = container.current;

    if (!el) {
      return;
    }

    // Initializes the chart and sets it to the state.
    let built: echarts.ECharts | null = null;

    const buildOrResize = () => {
      if (!el.clientWidth || !el.clientHeight) {
        return;
      } else if (built) {
        built.resize();
      } else {
        built = echarts.init(el, undefined, { renderer: 'canvas' });
        setChart(built);
      }
    };

    const observer = new ResizeObserver(buildOrResize);
    observer.observe(el);
    buildOrResize();

    // Cleans up the observer and the chart when the component unmounts.
    return () => {
      observer.disconnect();
      built?.dispose();
      setChart(null);
    };
  }, []);

  /* Runs once the observer has built the chart, and again for every later option. */
  useEffect(() => {
    chart?.setOption(option, true);
  }, [chart, option]);

  return (
    /* A figure rather than a div, since a canvas cannot carry a name. */
    <figure
      ref={container}
      aria-label={ariaLabel}
      className={cn('h-87.5 w-full', className)}
      style={style}
      data-test-chart
    />
  );
}
