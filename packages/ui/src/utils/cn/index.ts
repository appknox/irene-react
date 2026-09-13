import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Our shadow scale is numbered rather than t-shirt sized, so tailwind-merge
 * does not recognise `shadow-8` as a box-shadow and will not let it conflict
 * with `shadow-none`. Listing the suffixes puts them in the right group.
 *
 * Keep this in step with the shadow tokens in styles/theme.css — cn.test.ts
 * fails if the two drift apart.
 */
const SHADOW_SCALE = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [{ shadow: SHADOW_SCALE }],
    },
  },
});

/**
 * Join class names and resolve Tailwind conflicts, last one winning.
 *
 * clsx flattens the arguments — strings, arrays, and objects whose keys are
 * kept when their value is truthy. twMerge then drops earlier classes that
 * target the same property, so a caller's `p-2` overrides a component's `p-4`
 * instead of the two fighting on specificity.
 *
 * @example
 *   cn('p-4 text-sm', 'p-2')            // 'text-sm p-2'
 *   cn('rounded-md', isRound && 'rounded-full')
 *   cn({ 'opacity-50': disabled })
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export { SHADOW_SCALE };
