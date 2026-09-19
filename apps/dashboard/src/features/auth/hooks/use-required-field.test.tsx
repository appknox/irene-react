import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { useRequiredField } from '@/features/auth/hooks/use-required-field';

function Probe({ initial = '' }: { initial?: string }) {
  const form = useForm({ defaultValues: { code: initial } });
  const isEmpty = useRequiredField('code', form);

  return (
    <FormProvider {...form}>
      <input aria-label="Code" {...form.register('code')} />

      <button type="button" disabled={isEmpty}>
        Verify
      </button>
    </FormProvider>
  );
}

const button = () => screen.getByRole('button', { name: 'Verify' });

describe('useRequiredField', () => {
  it('reads an untouched field as empty', () => {
    render(<Probe />);

    expect(button()).toBeDisabled();
  });

  it('reads a filled field as complete', () => {
    render(<Probe initial="123456" />);

    expect(button()).toBeEnabled();
  });

  it('reads whitespace as empty, so a space does not count as filled', () => {
    render(<Probe initial="   " />);

    expect(button()).toBeDisabled();
  });

  it('treats a typed zero as filled, since an input reports a string', async () => {
    render(<Probe />);

    await userEvent.type(screen.getByLabelText('Code'), '0');

    expect(button()).toBeEnabled();
  });

  it('goes back to empty when the value is deleted', async () => {
    render(<Probe initial="123456" />);

    await userEvent.clear(screen.getByLabelText('Code'));

    expect(button()).toBeDisabled();
  });
});
