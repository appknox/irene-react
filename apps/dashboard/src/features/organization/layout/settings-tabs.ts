/** Where each tab of the organization's settings lives, as irene's routes name them. */
export const ORGANIZATION_SETTINGS_TABS = {
  settings: '/dashboard/organization/settings',
  integrations: '/dashboard/organization/settings/integrations',
  serviceAccount: '/dashboard/organization/settings/service-account',
  aiPoweredFeatures: '/dashboard/organization/settings/ai-powered-features',
} as const;
