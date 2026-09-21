import { createFileRoute } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { RecoverPage } from '@/features/auth/pages/recover';

export const Route = createFileRoute('/_unauthenticated/recover')({
  staticData: { pageTitle: () => akMT('recoverPasswordPageTitle') },
  component: RecoverPage,
});
