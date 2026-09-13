import { createFileRoute } from '@tanstack/react-router';
import { ConfigSmokeTest } from '@/components/ConfigSmokeTest';

export const Route = createFileRoute('/')({
  component: ConfigSmokeTest,
});
