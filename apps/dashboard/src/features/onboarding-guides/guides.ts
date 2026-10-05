import { akMT } from '@irene/translations/intl';

/** The products that have walkthroughs of their own. */
export type OnboardingGuideProduct = 'appknox' | 'storeknox';

/** One walkthrough, hosted outside the product and shown in a frame. */
export interface OnboardingGuide {
  id: string;
  title: string;
  url: string;
}

/** The walkthroughs under one heading. */
export interface OnboardingGuideCategory {
  category: string;
  guides: OnboardingGuide[];
}

/** What the VAPT product walks an account through. */
const _appknoxGuides = (): OnboardingGuideCategory[] => [
  {
    category: akMT('onboardingGuideModule.VA'),
    guides: [
      {
        id: 'va-guide',
        title: akMT('onboardingGuideModule.initiateVA'),
        url: 'https://appknox.portal.trainn.co/share/bEK4jmKvG16y1lqH9b9sPA/embed?mode=interactive',
      },
      {
        id: 'scan-results-guide',
        title: akMT('onboardingGuideModule.viewReports'),
        url: 'https://appknox.portal.trainn.co/share/gKJQU8gka8sX3ZLJD80CWg/embed?mode=interactive',
      },
      {
        id: 'invitation-guide',
        title: akMT('inviteUsers'),
        url: 'https://appknox.portal.trainn.co/share/bXBvltZ53ZpWxvrrhrqkbA/embed?mode=interactive',
      },
      {
        id: 'creating-teams-guide',
        title: akMT('onboardingGuideModule.createTeams'),
        url: 'https://appknox.portal.trainn.co/share/01VQVnUV64rjHIBsx6tzqQ/embed?mode=interactive',
      },
      {
        id: 'upload-access-guide',
        title: akMT('onboardingGuideModule.uploadAccess'),
        url: 'https://appknox.portal.trainn.co/share/FPsW0wVu5g6NtAZzHjrNrA/embed?mode=interactive',
      },
    ],
  },
  {
    category: akMT('SBOM'),
    guides: [
      {
        id: 'sbom-guide',
        title: akMT('onboardingGuideModule.generateSBOM'),
        url: 'https://appknox.portal.trainn.co/share/mMfpJY5qpu0czTtC4TKdtQ/embed?mode=interactive',
      },
    ],
  },
];

/** What store monitoring walks an account through. */
const _storeknoxGuides = (): OnboardingGuideCategory[] => [
  {
    category: akMT('storeknox.title'),
    guides: [
      {
        id: 'accessing-storeknox',
        title: akMT('storeknox.accessingStoreknox'),
        url: 'https://appknox.portal.trainn.co/share/VHHxO3qE3vgYJDEuusQPRw/embed?mode=interactive',
      },
      {
        id: 'using-inventory',
        title: akMT('storeknox.usingInventory'),
        url: 'https://appknox.portal.trainn.co/share/M2A4zJU5qMWSCLRnuzU4EA/embed?mode=interactive',
      },
      {
        id: 'discovering-apps',
        title: akMT('storeknox.discoveringApps'),
        url: 'https://appknox.portal.trainn.co/share/THztrvyoj3cyvXkXOpa5pg/embed?mode=interactive',
      },
      {
        id: 'reviewing-apps',
        title: akMT('storeknox.reviewingAppRequests'),
        url: 'https://appknox.portal.trainn.co/share/c6V0l6M3YpwRKFymbUHTpg/embed?mode=interactive',
      },
    ],
  },
];

/**
 * The walkthroughs a product lists, by what they are about.
 *
 * Built per render, so the titles follow the active locale. The URLs are the
 * recordings as published, and are the same for every install.
 *
 * @param product - Whose walkthroughs to list.
 * @returns The categories, each with its guides in the order they are shown.
 */
export const buildOnboardingGuides = (
  product: OnboardingGuideProduct
): OnboardingGuideCategory[] => (product === 'storeknox' ? _storeknoxGuides() : _appknoxGuides());
