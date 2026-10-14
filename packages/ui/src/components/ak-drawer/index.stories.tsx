import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  AkDrawer,
  AkDrawerBody,
  AkDrawerClose,
  AkDrawerContent,
  AkDrawerFooter,
  AkDrawerHeader,
  AkDrawerTrigger,
} from '@irene/ui/ak-drawer';

import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';

const meta = {
  title: 'Components/AkDrawer',
  component: AkDrawerContent,
  tags: ['autodocs'],
  args: {},
} satisfies Meta<typeof AkDrawerContent>;

export default meta;

type Story = StoryObj<typeof meta>;

/*
  The drawer is as wide as what it holds, so a story about a long body sets a
  width: left to spread across the viewport, this content would not overflow.
*/
const LONG_BODY = (
  <div className="w-100">
    {Array.from({ length: 25 }, (_, index) => (
      <AkTypography key={index} variant="body2" className="mb-3">
        Every scan is checked against the rules this organization has enabled, and anything a rule
        flags is listed with the evidence behind it.
      </AkTypography>
    ))}
  </div>
);

export const Playground: Story = {
  render: (args) => (
    <AkDrawer>
      <AkDrawerTrigger asChild>
        <AkButton variant="outlined">What is this?</AkButton>
      </AkDrawerTrigger>

      <AkDrawerContent {...args}>
        <AkDrawerHeader title="About this report" closeLabel="Close" />

        <AkDrawerBody>
          <AkTypography variant="body2" className="w-100 block">
            The report lists what the scan found, ranked by how much it matters.
          </AkTypography>
        </AkDrawerBody>
      </AkDrawerContent>
    </AkDrawer>
  ),
};

export const AnchoredLeft: Story = {
  name: 'Anchored left',
  render: (args) => (
    <AkDrawer>
      <AkDrawerTrigger asChild>
        <AkButton variant="outlined">Open the filters</AkButton>
      </AkDrawerTrigger>

      <AkDrawerContent {...args} anchor="left">
        <AkDrawerHeader title="Filters" closeLabel="Close" />

        <AkDrawerBody>
          <AkTypography variant="body2" className="w-100 block">
            Narrow the list to the findings worth looking at first.
          </AkTypography>
        </AkDrawerBody>
      </AkDrawerContent>
    </AkDrawer>
  ),
};

export const ScrollingBody: Story = {
  name: 'Scrolling body',
  render: (args) => (
    <AkDrawer>
      <AkDrawerTrigger asChild>
        <AkButton variant="outlined">Read the rules</AkButton>
      </AkDrawerTrigger>

      <AkDrawerContent {...args}>
        <AkDrawerHeader title="Scan rules" closeLabel="Close" />

        <AkDrawerBody>{LONG_BODY}</AkDrawerBody>
      </AkDrawerContent>
    </AkDrawer>
  ),
};

export const SizedByItsContent: Story = {
  name: 'Sized by its content',
  render: (args) => (
    <AkDrawer>
      <AkDrawerTrigger asChild>
        <AkButton variant="outlined">Open the wide panel</AkButton>
      </AkDrawerTrigger>

      <AkDrawerContent {...args}>
        <AkDrawerHeader title="AI Powered Features" closeLabel="Close" />

        <AkDrawerBody noGutter>
          <div className="my-4.25 mx-5.5 w-160 border border-border p-5">
            <AkTypography variant="body2">
              The panel sets its own width, and the drawer is as wide as the panel.
            </AkTypography>
          </div>
        </AkDrawerBody>
      </AkDrawerContent>
    </AkDrawer>
  ),
};

export const WithFooter: Story = {
  name: 'With a footer',
  render: (args) => (
    <AkDrawer>
      <AkDrawerTrigger asChild>
        <AkButton variant="outlined">Transfer credits</AkButton>
      </AkDrawerTrigger>

      <AkDrawerContent {...args}>
        <AkDrawerHeader title="Transfer credits" closeLabel="Close" />

        <AkDrawerBody>{LONG_BODY}</AkDrawerBody>

        <AkDrawerFooter>
          <AkButton>Transfer</AkButton>

          <AkDrawerClose asChild>
            <AkButton variant="outlined" color="neutral">
              Back
            </AkButton>
          </AkDrawerClose>
        </AkDrawerFooter>
      </AkDrawerContent>
    </AkDrawer>
  ),
};
