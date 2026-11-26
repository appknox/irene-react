import type { Meta, StoryObj } from '@storybook/react-vite';
import { AkTextarea } from '@irene/ui/ak-textarea';

const meta = {
  title: 'Components/AkTextarea',
  component: AkTextarea,
  tags: ['autodocs'],
  argTypes: {
    rows: { control: 'number' },
    disabled: { control: 'boolean' },
    errorMessage: { control: 'text' },
  },
  args: { rows: 6, disabled: false, placeholder: 'What this is for' },
} satisfies Meta<typeof AkTextarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = { args: { errorMessage: 'Please enter all the details' } };
