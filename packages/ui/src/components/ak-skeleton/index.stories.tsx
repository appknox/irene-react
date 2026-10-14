import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { StorySection } from '@irene/ui/story-layout';

const meta = {
  title: 'Components/AkSkeleton',
  component: AkSkeleton,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['rounded', 'rectangular', 'circular'] },
    width: { control: 'text' },
    height: { control: 'text' },
  },
  args: { variant: 'rounded', width: '100%', height: '1.2rem' },
} satisfies Meta<typeof AkSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Rounded for text and fields, rectangular for images, circular for avatars. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-6">
      <StorySection title="Rounded, for text and fields" className="w-80">
        <AkSkeleton {...args} variant="rounded" width="8rem" />
      </StorySection>

      <StorySection title="Rectangular, for images" className="w-80">
        <AkSkeleton {...args} variant="rectangular" width="8rem" />
      </StorySection>

      <StorySection title="Circular, for avatars" className="w-80">
        <AkSkeleton {...args} variant="circular" width="2.5rem" height="2.5rem" />
      </StorySection>
    </div>
  ),
};

/** The shapes it stands in for: a paragraph, a list row, a logo, and a filled container. */
export const Patterns: Story = {
  render: (args) => (
    <div className="flex w-full flex-col gap-8">
      <StorySection title="A paragraph" className="w-80">
        <AkSkeleton {...args} />

        <AkSkeleton {...args} />

        <AkSkeleton {...args} width="60%" />
      </StorySection>

      <StorySection title="A list row" className="w-80">
        <div className="flex w-full items-center gap-3">
          <AkSkeleton {...args} variant="circular" width="2.5rem" height="2.5rem" />

          <div className="flex flex-1 flex-col gap-2">
            <AkSkeleton {...args} width="70%" />

            <AkSkeleton {...args} width="40%" height="0.875rem" />
          </div>
        </div>
      </StorySection>

      <StorySection title="A logo, while the configuration loads" className="w-80">
        <AkSkeleton {...args} height="40px" className="max-w-42.5" />
      </StorySection>

      <StorySection title="Filling its container" className="w-80">
        <div className="w-full rounded-sm border border-border p-4">
          <AkSkeleton {...args} />
        </div>
      </StorySection>
    </div>
  ),
};
