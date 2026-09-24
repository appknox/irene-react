import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { setFormFieldErrors, toFormFieldErrors } from '@/utils/form-field-errors';

const schema = z.object({ username: z.string(), confirm_password: z.string() });

type Schema = z.infer<typeof schema>;

/** A refusal shaped the way the API answers one, which axios rejects with. */
const refusalWith = (data: unknown) =>
  Object.assign(new Error('Request failed'), {
    isAxiosError: true,
    response: { status: 400, data },
  });

const formFor = () => {
  const { result } = renderHook(() => {
    const form = useForm<Schema>({ defaultValues: { username: '', confirm_password: '' } });

    /* Reading the errors is what subscribes to them; react-hook-form tracks nothing unread. */
    return Object.assign(form, { errors: form.formState.errors });
  });

  return result;
};

describe('toFormFieldErrors', () => {
  it('returns the message for a field the schema declares', () => {
    expect(toFormFieldErrors<Schema>(schema, refusalWith({ username: ['Already taken'] }))).toEqual(
      [{ field: 'username', message: 'Already taken' }]
    );
  });

  it('returns every named field in the order the schema declares them', () => {
    const fieldErrors = toFormFieldErrors<Schema>(
      schema,
      refusalWith({ confirm_password: ["Doesn't match"], username: ['Already taken'] })
    );

    expect(fieldErrors.map(({ field }) => field)).toEqual(['username', 'confirm_password']);
  });

  it('returns the first message when a field carries several', () => {
    expect(
      toFormFieldErrors<Schema>(schema, refusalWith({ username: ['Too short', 'Already taken'] }))
    ).toEqual([{ field: 'username', message: 'Too short' }]);
  });

  it('returns nothing for a field the schema does not declare', () => {
    expect(
      toFormFieldErrors<Schema>(schema, refusalWith({ non_field_errors: ['Try later'] }))
    ).toEqual([]);
  });

  it('returns an empty list when the error carries no field messages', () => {
    expect(toFormFieldErrors<Schema>(schema, refusalWith(undefined))).toEqual([]);
  });
});

describe('setFormFieldErrors', () => {
  it('sets each message on its own form field', () => {
    const form = formFor();

    act(() => {
      setFormFieldErrors(form.current, [
        { field: 'username', message: 'Already taken' },
        { field: 'confirm_password', message: "Doesn't match" },
      ]);
    });

    expect(form.current.errors.username?.message).toBe('Already taken');
    expect(form.current.errors.confirm_password?.message).toBe("Doesn't match");
  });

  it('sets no errors when the list is empty', () => {
    const form = formFor();

    act(() => {
      setFormFieldErrors(form.current, []);
    });

    expect(form.current.errors.username).toBeUndefined();
  });
});
