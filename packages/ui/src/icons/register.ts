import { addCollection } from '@iconify/react';
import icons from '@irene/ui/icons/icons.json';

/*
  Registers the bundled sets with Iconify at import time.

  It has to happen before the first render: without it Iconify treats an icon
  name as unknown and fetches it from its public API, so the first paint has no
  icon and the app makes a network call it does not need.

  Import this for the side effect — `import '@irene/ui/icons/register'`.
*/
for (const collection of Object.values(icons)) {
  addCollection(collection);
}
