import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { buildSkInventoryApp } from '@tests/factories';

import { InventoryAppContext, useInventoryApp } from './use-inventory-app';

describe('useInventoryApp', () => {
  it('reads the app the details layout provides', () => {
    const app = buildSkInventoryApp();

    const { result } = renderHook(() => useInventoryApp(), {
      wrapper: ({ children }) => <InventoryAppContext value={app}>{children}</InventoryAppContext>,
    });

    expect(result.current).toBe(app);
  });

  it('refuses to be read outside the details layout', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useInventoryApp())).toThrow(
      'useInventoryApp is read outside the inventory details layout'
    );

    error.mockRestore();
  });
});
