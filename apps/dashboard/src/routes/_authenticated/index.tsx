import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { HomePage } from '@/features/home/pages/home';

export const Route = createFileRoute('/_authenticated/')({
  staticData: { pageTitle: () => akMT('home') },
  component: HomePage,
});
