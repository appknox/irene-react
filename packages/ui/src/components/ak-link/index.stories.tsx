import type { Meta, StoryObj } from '@storybook/react-vite';
import { AkLink } from '@irene/ui/ak-link';

const meta = {
  title: 'Components/AkLink',
  component: AkLink,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'error',
        'success',
        'warning',
        'textPrimary',
        'textSecondary',
        'inherit',
      ],
    },
    underline: { control: 'select', options: ['always', 'hover', 'none'] },
  },
  args: { children: 'Contact support', href: '#', color: 'primary', underline: 'always' },
} satisfies Meta<typeof AkLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every colour the design system tints a link with. */
export const Colors: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <AkLink href="#">Primary</AkLink>
      <AkLink href="#" color="secondary">
        Secondary
      </AkLink>
      <AkLink href="#" color="error">
        Error
      </AkLink>
      <AkLink href="#" color="success">
        Success
      </AkLink>
      <AkLink href="#" color="warning">
        Warning
      </AkLink>
      <AkLink href="#" color="textPrimary">
        Text primary
      </AkLink>
      <AkLink href="#" color="textSecondary">
        Text secondary
      </AkLink>
    </div>
  ),
};

/** When the underline is drawn. */
export const Underline: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <AkLink href="#" underline="always">
        Always
      </AkLink>

      <AkLink href="#" underline="hover">
        On hover
      </AkLink>

      <AkLink href="#" underline="none">
        Never
      </AkLink>
    </div>
  ),
};

/** Inside a sentence, where it inherits the surrounding type. */
export const InText: Story = {
  render: () => (
    <p className="text-base text-foreground-muted">
      You seem to have landed on an invalid page. Please <AkLink href="#">contact support</AkLink>.
    </p>
  ),
};
