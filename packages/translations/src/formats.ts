import type { CustomFormats } from 'react-intl';

/** Named formats a message or `formatDate`/`formatNumber` call can refer to by name. */
export const FORMATS: CustomFormats = {
  time: {
    hhmmss: { hour: 'numeric', minute: 'numeric', second: 'numeric' },
  },
  date: {
    hhmmss: { hour: 'numeric', minute: 'numeric', second: 'numeric' },
    /** A calendar date with the month named, so 03/04 is never read the wrong way round: "Apr 3, 2026". */
    mediumDate: { year: 'numeric', month: 'short', day: 'numeric' },
    /** A calendar date with the month written out: "April 3, 2026". */
    longDate: { year: 'numeric', month: 'long', day: 'numeric' },
  },
  number: {
    EUR: { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 },
    USD: { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 },
  },
};
