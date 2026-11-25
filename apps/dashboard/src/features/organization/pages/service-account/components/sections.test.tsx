import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkFormProvider } from '@irene/ui/ak-form';

import { buildServiceAccountSchema, type ServiceAccountFormSchema } from '../schemas/create';
import { AccountOverviewSection } from './account-overview';
import { SectionCard } from './section-card';

/** The overview section reads its fields from the form around it, as the screen gives it one. */
function OverviewInForm() {
  const form = useForm<ServiceAccountFormSchema>({
    defaultValues: { name: '', description: '' },
  });

  return (
    <AkFormProvider {...form}>
      <form noValidate>
        <AccountOverviewSection />
      </form>
    </AkFormProvider>
  );
}

describe('SectionCard', () => {
  it('names the section and holds what is inside it', () => {
    render(
      <SectionCard title="Account Overview" testAttribute="probe">
        <p>Contents</p>
      </SectionCard>
    );

    expect(screen.getByText('Account Overview')).toBeInTheDocument();
    expect(screen.getByText('Contents')).toBeInTheDocument();
    expect(document.querySelector('[data-test-probe-footer]')).toBeNull();
  });

  it('carries a control in its header where it is given one', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(
      <SectionCard
        title="Account Overview"
        testAttribute="probe"
        headerAction={<AkButton onClick={onEdit}>Edit</AkButton>}
      >
        <p>Contents</p>
      </SectionCard>
    );

    await user.click(screen.getByText('Edit'));

    expect(onEdit).toHaveBeenCalled();
  });

  it('tints its header and carries its controls while the section is open', () => {
    render(
      <SectionCard
        title="Account Overview"
        testAttribute="probe"
        headerColor="primary"
        footerAction={<AkButton>Update</AkButton>}
      >
        <p>Contents</p>
      </SectionCard>
    );

    expect(screen.getByText('Account Overview')).toHaveClass('text-inherit');
    expect(document.querySelector('[data-test-probe-footer]')).not.toBeNull();
    expect(screen.getByText('Update')).toBeInTheDocument();
  });
});

describe('the account overview section', () => {
  it('asks for a name and a description, both required', () => {
    render(<OverviewInForm />);

    expect(
      screen.getByText(`${akMT('serviceAccountModule.nameOfTheServiceAccount')} *`)
    ).toBeInTheDocument();

    expect(screen.getByText(`${akMT('description')} *`)).toBeInTheDocument();
  });

  it('takes what is typed into both fields', async () => {
    const user = userEvent.setup();

    render(<OverviewInForm />);

    const name = document.querySelector(
      '[data-test-service-account-name-input]'
    ) as HTMLInputElement;

    const description = document.querySelector(
      '[data-test-service-account-description-input]'
    ) as HTMLTextAreaElement;

    await user.type(name, 'CI uploads');
    await user.type(description, 'Used by the build');

    expect(name).toHaveValue('CI uploads');
    expect(description).toHaveValue('Used by the build');
  });
});

describe('the service account schema', () => {
  it('refuses a name or description that is only spaces', () => {
    const result = buildServiceAccountSchema().safeParse({ name: '  ', description: ' ' });

    expect(result.success).toBe(false);
  });

  it('accepts a name and a description', () => {
    const result = buildServiceAccountSchema().safeParse({
      name: 'CI uploads',
      description: 'Used by the build',
    });

    expect(result.success).toBe(true);
  });
});
