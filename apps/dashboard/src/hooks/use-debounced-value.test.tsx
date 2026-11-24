import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebouncedValue } from './use-debounced-value';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports the value it started with', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 500));

    expect(result.current).toBe('a');
  });

  it('holds the old value until the delay has passed', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 500), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });

    act(() => void vi.advanceTimersByTime(499));

    expect(result.current).toBe('a');

    act(() => void vi.advanceTimersByTime(1));

    expect(result.current).toBe('ab');
  });

  it('settles once on a value that changed several times', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 500), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });

    act(() => void vi.advanceTimersByTime(400));

    rerender({ value: 'abc' });

    act(() => void vi.advanceTimersByTime(400));

    expect(result.current).toBe('a');

    act(() => void vi.advanceTimersByTime(100));

    expect(result.current).toBe('abc');
  });
});
