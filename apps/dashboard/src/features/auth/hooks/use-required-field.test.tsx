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
  it('reports an untouched field as empty', () => {
    render(<Probe />);

    expect(button()).toBeDisabled();
  });

  it('reports a field with a value as filled', () => {
    render(<Probe initial="123456" />);

    expect(button()).toBeEnabled();
  });

  it('reports a field holding only whitespace as empty', () => {
    render(<Probe initial="   " />);

    expect(button()).toBeDisabled();
  });

  it("reports a field holding the string '0' as filled", async () => {
    render(<Probe />);

    await userEvent.type(screen.getByLabelText('Code'), '0');

    expect(button()).toBeEnabled();
  });

  it('reports the field as empty again once the value is deleted', async () => {
    render(<Probe initial="123456" />);

    await userEvent.clear(screen.getByLabelText('Code'));

    expect(button()).toBeDisabled();
  });
});
