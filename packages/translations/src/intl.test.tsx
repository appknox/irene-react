import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { akMT, getIntl, getLocale, setLocale, subscribeToLocale } from '@irene/translations/intl';

import en from './generated/en.json';
import ja from './generated/ja.json';

afterEach(async () => {
  await setLocale('en');
});

describe('intl', () => {
  describe('before any locale is set', () => {
    it('uses English', () => {
      expect(getLocale()).toBe('en');
      expect(akMT('login')).toBe(en.login);
    });
  });

  describe('setLocale', () => {
    it('switches messages to the new locale', async () => {
      await setLocale('ja');

      expect(getLocale()).toBe('ja');
      expect(akMT('login')).toBe(ja.login);
    });

    it('switches back to English', async () => {
      await setLocale('ja');
      await setLocale('en');

      expect(akMT('login')).toBe(en.login);
    });

    it('keeps the last requested locale when calls overlap', async () => {
      const toJapanese = setLocale('ja');
      const toEnglish = setLocale('en');

      await Promise.all([toJapanese, toEnglish]);

      expect(getLocale()).toBe('en');
      expect(akMT('login')).toBe(en.login);
    });
  });

  describe('akMT', () => {
    it('formats a message in English by default', () => {
      expect(akMT('login')).toBe(en.login);
    });

    it('fills in arguments', () => {
      expect(akMT('apiScanModule.uniqueApisRequestsCaptured', { count: 5 })).toBe(
        '5 Unique API Request(s) have been captured so far'
      );
    });

    it('follows a locale change without being re-imported', async () => {
      await setLocale('ja');

      expect(akMT('login')).toBe(ja.login);
    });

    it('picks the plural form for the count', () => {
      expect(akMT('monthWithNum', { numMonths: 0 })).toBe('0 Month');
      expect(akMT('monthWithNum', { numMonths: 1 })).toBe('1 Month');
      expect(akMT('monthWithNum', { numMonths: 6 })).toBe('6 Months');
    });

    it('picks the select option, falling back to other', () => {
      expect(akMT('organizationNameAddedOrUpdated', { type: 'add' })).toContain('added');

      expect(akMT('organizationNameAddedOrUpdated', { type: 'unknown' })).toContain('updated');
    });

    it('reads a nested message by its dotted id', () => {
      expect(akMT('accountNotifSettings.vaNotificationTitle')).toBe('VA Notification');
    });

    it('reads an array item by its index', () => {
      expect(akMT('capturedApiEmptySteps.1')).toBe('Check if correct API URL filters are set');
    });
  });

  describe('akMT with markup', () => {
    it('renders line breaks as elements when placed in JSX', () => {
      const { container } = render(<p>{akMT('capturedApiEmptyDesc')}</p>);

      expect(container.querySelectorAll('br')).toHaveLength(2);
      expect(container).toHaveTextContent('1. Make sure you go through all views of the app');
    });

    it('renders other tags as elements, not raw HTML', () => {
      const { container } = render(<p>{akMT('uploadNewProject')}</p>);

      expect(container.querySelector('b')).toHaveTextContent('Upload App');
      expect(container.innerHTML).not.toContain('&lt;b&gt;');
    });

    it('fills in arguments inside markup', () => {
      const { container } = render(
        <p>{akMT('apiScanModule.reportRegenerateText', { reportType: 'PDF' })}</p>
      );

      expect(container).toHaveTextContent('PDF');
    });

    it('still returns a string for a plain message', () => {
      expect(akMT('login')).toBeTypeOf('string');
    });

    it('returns a string for a message whose translation dropped the markup', async () => {
      await setLocale('ja');

      const { container } = render(
        <p>
          {akMT('serviceAccountModule.selectedProjectAccess', {
            projectAccess: 'All',
          })}
        </p>
      );

      expect(container.querySelector('strong')).toBeNull();
      expect(container).toHaveTextContent('Selected - All');
    });
  });

  describe('subscribeToLocale', () => {
    it('notifies listeners after a change', async () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToLocale(listener);

      await setLocale('ja');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(getLocale()).toBe('ja');

      unsubscribe();
    });

    it('stops notifying once unsubscribed', async () => {
      const listener = vi.fn();

      subscribeToLocale(listener)();
      await setLocale('ja');

      expect(listener).not.toHaveBeenCalled();
    });

    it('does not notify for a superseded call', async () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToLocale(listener);

      await Promise.all([setLocale('ja'), setLocale('en')]);

      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
    });
  });

  describe('getIntl', () => {
    it('throws at runtime when a call site that is not type-checked omits arguments', () => {
      expect(() =>
        getIntl().formatMessage({ id: 'apiScanModule.uniqueApisRequestsCaptured' })
      ).toThrow();
    });

    it('formats numbers with the named currency formats', () => {
      expect(getIntl().formatNumber(1234.5, { format: 'USD' })).toBe('$1,234.50');
    });
  });
});
