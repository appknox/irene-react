import { cva } from 'class-variance-authority';

/*
  The design system's table.

  `variant` decides which rules are drawn, `borderColor` how strongly. The two
  are independent because the header carries its own rule: a neutral header is
  outlined in the border colour whatever the body uses, and only a transparent
  one follows `borderColor`.
*/
export const akTableVariants = cva(
  'w-full border-collapse text-left [&_td]:align-middle [&_th]:align-middle [&_th]:font-medium',
  {
    variants: {
      variant: {
        /** A rule under every row but the last, and a rule around the header. */
        'semi-bordered':
          '[&_tbody_td]:border-b [&_tbody_tr:last-child_td]:border-b-0 [&_thead_tr]:border',

        /*
          Every cell boxed. The first row drops its top border: the header
          already draws that line, and two rules meeting there collapse to
          whichever is stronger rather than to the header's own.
        */
        'full-bordered':
          '[&_tbody_td]:border [&_tbody_tr:first-child_td]:border-t-0 [&_thead_th:not(:last-child)]:border-r [&_thead_tr]:border',

        /** No rules at all, for a table inside a card that draws its own. */
        borderless: '',
      },

      headerColor: {
        neutral: '[&_thead_th]:bg-neutral-100',
        transparent: '[&_thead_th]:bg-transparent',
      },

      /** The rules between the body's cells. */
      borderColor: {
        light: '[&_tbody_td]:border-divider',
        dark: '[&_tbody_td]:border-divider-strong',
      },

      /** Tints a row under the pointer, for a table whose rows can be acted on. */
      hoverable: { true: '[&_tbody_tr:hover_td]:bg-hover-light' },

      /** Tightens the cells, for a table that has to show more rows at once. */
      dense: { true: '' },
    },

    compoundVariants: [
      /* A neutral header is outlined in the border colour, whatever the body uses. */
      {
        headerColor: 'neutral',
        class: '[&_thead_th]:border-border [&_thead_tr]:border-border',
      },

      /* A transparent header follows the body instead, since nothing else sets it apart. */
      {
        headerColor: 'transparent',
        borderColor: 'light',
        class: '[&_thead_th]:border-divider [&_thead_tr]:border-divider',
      },
      {
        headerColor: 'transparent',
        borderColor: 'dark',
        class: '[&_thead_th]:border-divider-strong [&_thead_tr]:border-divider-strong',
      },

      {
        dense: true,
        class: '[&_tbody_td]:px-4.5 [&_tbody_td]:py-2 [&_thead_th]:px-4.5 [&_thead_th]:py-1.5',
      },
      {
        dense: false,
        class: '[&_tbody_td]:px-4.5 [&_tbody_td]:py-3.5 [&_thead_th]:px-4.5 [&_thead_th]:py-2.5',
      },
    ],

    defaultVariants: {
      variant: 'semi-bordered',
      headerColor: 'neutral',
      borderColor: 'light',
      hoverable: false,
      dense: false,
    },
  }
);
