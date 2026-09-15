import type { CustomFormats } from 'react-intl';

/** Named formats a message or `formatDate`/`formatNumber` call can refer to by name. */
export const FORMATS: CustomFormats = {
  time: {
    hhmmss: { hour: 'numeric', minute: 'numeric', second: 'numeric' },
  },
  date: {
    hhmmss: { hour: 'numeric', minute: 'numeric', second: 'numeric' },
  },
  number: {
    EUR: { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 },
    USD: { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 },
  },
};
