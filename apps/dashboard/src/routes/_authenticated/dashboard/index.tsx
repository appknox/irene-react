import { createFileRoute } from '@tanstack/react-router';
import { redirectToPage } from '@/actions/redirect-to-page';

export const Route = createFileRoute('/_authenticated/dashboard/')({
  beforeLoad: () => redirectToPage('/dashboard/home'),
});
