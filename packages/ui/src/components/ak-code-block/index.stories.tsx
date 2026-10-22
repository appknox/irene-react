import type { Meta, StoryObj } from '@storybook/react-vite';
import { AkCodeBlock } from '@irene/ui/ak-code-block';

const COMMAND = 'appknox upload <path to apk/ipa file>';

const LONG_COMMAND =
  'curl -L https://github.com/appknox/appknox-go/releases/latest/download/appknox-`uname -s`-x86_64 > /usr/local/bin/appknox && chmod +x /usr/local/bin/appknox';

const SCRIPT = `if [ "$AGENT_JOBSTATUS" == "Succeeded" ]; then
  ./appknox upload $APPCENTER_OUTPUT_DIRECTORY/app.apk
fi`;

const meta = {
  title: 'Components/AkCodeBlock',
  component: AkCodeBlock,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['light', 'dark'] },
  },
  args: { code: COMMAND, variant: 'light', copyLabel: 'Copy' },
} satisfies Meta<typeof AkCodeBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** `variant`: light is a tinted panel on the page, dark is white text on black. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-foreground-muted">variant=&quot;light&quot; (default)</span>

        <AkCodeBlock {...args} variant="light" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-foreground-muted">variant=&quot;dark&quot;</span>

        <AkCodeBlock {...args} variant="dark" />
      </div>
    </div>
  ),
};

/** A long line scrolls inside the block, and stops short of the copy button. */
export const LongLine: Story = {
  args: { code: LONG_COMMAND },
  render: (args) => (
    <div className="flex max-w-120 flex-col gap-6">
      <AkCodeBlock {...args} variant="light" />

      <AkCodeBlock {...args} variant="dark" />
    </div>
  ),
};

/** Several lines keep their indentation. */
export const MultiLine: Story = {
  args: { code: SCRIPT },
};

/** Without `copyLabel` there is no copy button. */
export const WithoutCopy: Story = {
  args: { copyLabel: undefined },
};
