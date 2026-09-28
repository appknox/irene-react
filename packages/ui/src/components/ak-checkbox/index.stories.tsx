import { useState, type ComponentProps, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkLabel } from '@irene/ui/ak-label';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { cn } from '@irene/ui/cn';

const meta = {
  title: 'Components/AkCheckbox',
  component: AkCheckbox,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    color: {
      control: 'select',
      options: ['primary', 'neutral', 'error', 'success', 'warning', 'info'],
    },
  },
  args: { checked: false, disabled: false, color: 'primary' },
} satisfies Meta<typeof AkCheckbox>;

export default meta;

type Story = StoryObj<typeof meta>;

type CheckedState = ComponentProps<typeof AkCheckbox>['checked'];

/**
 * A box that holds its own state, so every example here can be ticked.
 *
 * The component is controlled, and a story that passed `checked` alone would
 * render a box that never moves. The control still drives it: changing
 * `checked` in the panel resets the box to what it is set to.
 *
 * @param props.checked - What the box starts as, and what the control resets it to.
 */
function ToggleableCheckbox({ checked, ...props }: ComponentProps<typeof AkCheckbox>) {
  const [state, setState] = useState<CheckedState>(checked);
  const [control, setControl] = useState<CheckedState>(checked);

  /* Reset to what the control says, the moment the panel changes it. */
  if (control !== checked) {
    setControl(checked);
    setState(checked);
  }

  return <AkCheckbox {...props} checked={state} onCheckedChange={setState} />;
}

/**
 * Says what an example stands for, on hover.
 *
 * The tooltip takes an element of its own rather than the box: the trigger
 * carries a `data-state` of its own, and on the box that would displace the
 * state the tint and the mark are drawn from. The element also catches a
 * pointer that a disabled box would swallow.
 *
 * @param props.title - What the box below it shows.
 * @param props.children - The box.
 */
function AnnotatedCheckbox({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <AkTooltip title={title} arrow>
      <span className={cn('inline-flex')}>{children}</span>
    </AkTooltip>
  );
}

export const Playground: Story = {
  render: (args) => (
    <AnnotatedCheckbox title="Click to tick. Changing checked in the controls panel resets it.">
      <ToggleableCheckbox {...args} />
    </AnnotatedCheckbox>
  ),
};

/** Every state, side by side: empty, ticked, part-ticked, disabled and invalid. */
export const States: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <AnnotatedCheckbox title="Empty: nothing chosen">
        <ToggleableCheckbox checked={false} />
      </AnnotatedCheckbox>

      <AnnotatedCheckbox title="Ticked">
        <ToggleableCheckbox checked />
      </AnnotatedCheckbox>

      <AnnotatedCheckbox title="Part-ticked, for a group whose members disagree. A screen reader reads it as mixed.">
        <ToggleableCheckbox checked="indeterminate" />
      </AnnotatedCheckbox>

      <AnnotatedCheckbox title="Disabled: the box is empty and takes no click">
        <AkCheckbox disabled />
      </AnnotatedCheckbox>

      <AnnotatedCheckbox title="Disabled while ticked, for a choice already made elsewhere">
        <AkCheckbox checked disabled />
      </AnnotatedCheckbox>

      <AnnotatedCheckbox title="Invalid: aria-invalid, for a box a form requires">
        <ToggleableCheckbox aria-invalid />
      </AnnotatedCheckbox>
    </div>
  ),
};

/** The colours a ticked box takes. An empty box is the same in all of them. */
export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <AnnotatedCheckbox title="primary: the default, and what a form uses">
        <ToggleableCheckbox checked color="primary" />
      </AnnotatedCheckbox>

      <AnnotatedCheckbox title="neutral: for a box that should not draw the eye">
        <ToggleableCheckbox checked color="neutral" />
      </AnnotatedCheckbox>

      <AnnotatedCheckbox title="error: for a choice that destroys something">
        <ToggleableCheckbox checked color="error" />
      </AnnotatedCheckbox>

      <AnnotatedCheckbox title="success: for a check that has passed">
        <ToggleableCheckbox checked color="success" />
      </AnnotatedCheckbox>

      <AnnotatedCheckbox title="warning: for a choice with a consequence">
        <ToggleableCheckbox checked color="warning" />
      </AnnotatedCheckbox>

      <AnnotatedCheckbox title="info: for a choice that only tells the user something">
        <ToggleableCheckbox checked color="info" />
      </AnnotatedCheckbox>
    </div>
  ),
};

/** Stands for a group whose members disagree, which a screen reader reads as mixed. */
export const Indeterminate: Story = {
  args: { checked: 'indeterminate' },
  render: (args) => (
    <AnnotatedCheckbox title="Clicking it settles the group: the next click ticks every member.">
      <ToggleableCheckbox {...args} />
    </AnnotatedCheckbox>
  ),
};

/** A box wired to its own state, as a form would wire it. */
function TermsCheckbox() {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <AnnotatedCheckbox title="The label is wired by htmlFor, so clicking the text ticks the box">
        <AkCheckbox
          id="terms"
          checked={accepted}
          onCheckedChange={(next) => setAccepted(next === true)}
        />
      </AnnotatedCheckbox>

      <AkLabel htmlFor="terms">I accept the terms and conditions</AkLabel>
    </div>
  );
}

/** Beside the label it belongs to, which ticks the box when clicked. */
export const WithLabel: Story = { render: () => <TermsCheckbox /> };
