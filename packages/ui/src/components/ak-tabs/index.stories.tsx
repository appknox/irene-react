import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkIcon } from '@irene/ui/ak-icon';
import { AkTabs, AkTabsBadge, AkTabsContent, AkTabsList, AkTabsTrigger } from '@irene/ui/ak-tabs';
import { AkTypography } from '@irene/ui/ak-typography';
import { StorySection } from '@irene/ui/story-layout';

const VARIANTS = ['line', 'shadow', 'segmented'] as const;

const TABS = [
  { value: 'files', label: 'Files', icon: 'material-symbols:assignment', count: 9 },
  { value: 'members', label: 'Members', icon: 'material-symbols:group', count: 100 },
  { value: 'settings', label: 'Settings', icon: 'material-symbols:settings', count: 0 },
] as const;

const meta = {
  title: 'Components/AkTabs',
  component: AkTabsList,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: VARIANTS },
  },
  args: { variant: 'line' },
} satisfies Meta<typeof AkTabsList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A row with icons and counts, and a view under it for each tab. */
export const Playground: Story = {
  render: (args) => (
    <AkTabs defaultValue="files" className="w-full">
      <AkTabsList {...args}>
        {TABS.map((tab) => (
          <AkTabsTrigger key={tab.value} value={tab.value}>
            <AkIcon name={tab.icon} />

            {tab.label}

            <AkTabsBadge>{tab.count}</AkTabsBadge>
          </AkTabsTrigger>
        ))}
      </AkTabsList>

      {TABS.map((tab) => (
        <AkTabsContent key={tab.value} value={tab.value}>
          <AkTypography>The content for {tab.label}.</AkTypography>
        </AkTabsContent>
      ))}
    </AkTabs>
  ),
};

/** Each variant, with a disabled tab at the end. */
export const Variants: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-8">
      {VARIANTS.map((variant) => (
        <StorySection key={variant} title={variant}>
          <AkTabs defaultValue="files" className="w-full">
            <AkTabsList variant={variant}>
              {TABS.map((tab) => (
                <AkTabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </AkTabsTrigger>
              ))}

              <AkTabsTrigger value="archived" disabled>
                Archived
              </AkTabsTrigger>
            </AkTabsList>
          </AkTabs>
        </StorySection>
      ))}
    </div>
  ),
};

/** A count on a tint, the default, or as bare text; and any content in place of a number. */
export const Badges: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-8">
      <StorySection title="On a tint">
        <AkTabs defaultValue="files" className="w-full">
          <AkTabsList {...args}>
            {TABS.map((tab) => (
              <AkTabsTrigger key={tab.value} value={tab.value}>
                {tab.label}

                <AkTabsBadge>{tab.count}</AkTabsBadge>
              </AkTabsTrigger>
            ))}
          </AkTabsList>
        </AkTabs>
      </StorySection>

      <StorySection title="As bare text">
        <AkTabs defaultValue="files" className="w-full">
          <AkTabsList {...args}>
            {TABS.map((tab) => (
              <AkTabsTrigger key={tab.value} value={tab.value}>
                {tab.label}

                <AkTabsBadge background={false}>{tab.count}</AkTabsBadge>
              </AkTabsTrigger>
            ))}
          </AkTabsList>
        </AkTabs>
      </StorySection>

      <StorySection title="Custom content">
        <AkTabs defaultValue="files" className="w-full">
          <AkTabsList {...args}>
            {TABS.map((tab) => (
              <AkTabsTrigger key={tab.value} value={tab.value}>
                {tab.label}

                <AkTabsBadge>
                  <AkIcon name="material-symbols:add" className="size-3.5" />
                  {tab.count}
                </AkTabsBadge>
              </AkTabsTrigger>
            ))}
          </AkTabsList>
        </AkTabs>
      </StorySection>
    </div>
  ),
};

/** Selection held by the caller, as a route or a search param would hold it. */
export const Controlled: Story = {
  render: function ControlledTabs(args) {
    const [active, setActive] = useState('members');

    return (
      <div className="flex w-full flex-col gap-4">
        <AkTabs value={active} onValueChange={setActive} className="w-full">
          <AkTabsList {...args}>
            {TABS.map((tab) => (
              <AkTabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </AkTabsTrigger>
            ))}
          </AkTabsList>
        </AkTabs>

        <AkTypography color="textSecondary">Active: {active}</AkTypography>
      </div>
    );
  },
};

/**
 * Tabs that navigate: each tab is a link, the route decides which is active,
 * and `manual` activation stops the arrow keys from navigating as they move.
 */
export const AsLinks: Story = {
  render: (args) => (
    <AkTabs value="files" activationMode="manual" className="w-full">
      <AkTabsList {...args}>
        {TABS.map((tab) => (
          <AkTabsTrigger key={tab.value} value={tab.value} asChild>
            <a href={`#${tab.value}`}>{tab.label}</a>
          </AkTabsTrigger>
        ))}
      </AkTabsList>
    </AkTabs>
  ),
};

/** A column of tabs beside its view. */
export const Vertical: Story = {
  render: (args) => (
    <AkTabs defaultValue="files" orientation="vertical" className="w-full">
      <AkTabsList {...args}>
        {TABS.map((tab) => (
          <AkTabsTrigger key={tab.value} value={tab.value}>
            <AkIcon name={tab.icon} />

            {tab.label}
          </AkTabsTrigger>
        ))}
      </AkTabsList>

      {TABS.map((tab) => (
        <AkTabsContent key={tab.value} value={tab.value}>
          <AkTypography>The content for {tab.label}.</AkTypography>
        </AkTabsContent>
      ))}
    </AkTabs>
  ),
};
