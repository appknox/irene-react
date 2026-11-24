import { createFileRoute } from '@tanstack/react-router';
import { redirectToPage } from '@/actions/redirect-to-page';

export const Route = createFileRoute('/_authenticated/')({
  beforeLoad: () => redirectToPage('/dashboard/home'),
});
