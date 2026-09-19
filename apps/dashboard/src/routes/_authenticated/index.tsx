import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '@/features/home/pages/home';

export const Route = createFileRoute('/_authenticated/')({
  component: HomePage,
});
