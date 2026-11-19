import { act, renderHook, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { akNotify } from '@irene/ui/notify';

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

/** Stands in for a browser that refuses the clipboard. */
const refuseClipboard = () =>
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    /* Installs the clipboard jsdom does not have. */
    userEvent.setup();

    vi.spyOn(akNotify, 'success').mockReturnValue('');
    vi.spyOn(akNotify, 'error').mockReturnValue('');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('puts the text on the clipboard and says it copied', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(() => result.current.copy('https://api.appknox.com'));

    await expect(navigator.clipboard.readText()).resolves.toBe('https://api.appknox.com');
    expect(akNotify.success).toHaveBeenCalledWith(akMT('copiedToClipboard'));
  });

  it('reports a copy as done, then forgets it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.isCopied).toBe(false);

    await act(() => result.current.copy('copied'));

    expect(result.current.isCopied).toBe(true);

    act(() => vi.advanceTimersByTime(2000));

    expect(result.current.isCopied).toBe(false);

    vi.useRealTimers();
  });

  it('says so when the browser refuses the clipboard', async () => {
    refuseClipboard();

    const { result } = renderHook(() => useCopyToClipboard());

    await act(() => result.current.copy('refused'));

    expect(akNotify.error).toHaveBeenCalledWith(akMT('pleaseTryAgain'));
    expect(result.current.isCopied).toBe(false);
  });

  it('answers whether the copy went through', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    const succeeded = await act(() => result.current.copy('fine'));

    expect(succeeded).toBe(true);

    refuseClipboard();

    const failed = await act(() => result.current.copy('refused'));

    expect(failed).toBe(false);
  });

  it('takes the messages the caller gives it', async () => {
    const { result } = renderHook(() =>
      useCopyToClipboard({ successMessage: 'Token copied', errorMessage: 'No clipboard' })
    );

    await act(() => result.current.copy('token'));

    expect(akNotify.success).toHaveBeenCalledWith('Token copied');

    refuseClipboard();

    await act(() => result.current.copy('token'));

    expect(akNotify.error).toHaveBeenCalledWith('No clipboard');
  });

  it('shows no notification when the caller drops it', async () => {
    const { result } = renderHook(() =>
      useCopyToClipboard({ successMessage: null, errorMessage: null })
    );

    await act(() => result.current.copy('quiet'));

    expect(akNotify.success).not.toHaveBeenCalled();

    refuseClipboard();

    await act(() => result.current.copy('quiet'));

    expect(akNotify.error).not.toHaveBeenCalled();
  });

  it('runs the caller’s own work after a copy', async () => {
    const onCopied = vi.fn();
    const onFailed = vi.fn();

    const { result } = renderHook(() => useCopyToClipboard({ onCopied, onFailed }));

    await act(() => result.current.copy('shared link'));

    expect(onCopied).toHaveBeenCalledWith('shared link');
    expect(onFailed).not.toHaveBeenCalled();

    refuseClipboard();

    await act(() => result.current.copy('shared link'));

    await waitFor(() => expect(onFailed).toHaveBeenCalledWith(expect.any(Error)));
  });

  it('calls the callbacks the caller has now, not the ones it started with', async () => {
    const first = vi.fn();
    const second = vi.fn();

    const { result, rerender } = renderHook(
      ({ onCopied }: { onCopied: () => void }) => useCopyToClipboard({ onCopied }),
      { initialProps: { onCopied: first } }
    );

    rerender({ onCopied: second });

    await act(() => result.current.copy('latest'));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('latest');
  });
});
