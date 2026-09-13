import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest does not unmount between tests, so queries would see earlier renders.
afterEach(cleanup);

/*
  jsdom implements no layout and no pointer capture, both of which Radix uses
  to position and drive its popovers. Without these a Select never opens and
  the failure looks like a component bug rather than a missing browser API.
*/
Element.prototype.hasPointerCapture ??= () => false;

Element.prototype.setPointerCapture ??= () => {};

Element.prototype.releasePointerCapture ??= () => {};

Element.prototype.scrollIntoView ??= () => {};

globalThis.ResizeObserver ??= class {
  observe() {} //NOSONAR
  unobserve() {} //NOSONAR
  disconnect() {} //NOSONAR
};
