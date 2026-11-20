import { describe, expect, it } from 'vitest';
import { ireneColumnShares, skStoreTableColumnShares } from './column-widths';

describe('ireneColumnShares', () => {
  it('gives each column its share of the row, as irene’s fixed table spreads it', () => {
    expect(ireneColumnShares([100, 300])).toEqual(['25.00%', '75.00%']);
  });

  it('counts a column irene gives no width as ember-table’s default of 100', () => {
    expect(ireneColumnShares([50, 200, undefined, 80])).toEqual([
      '11.63%',
      '46.51%',
      '23.26%',
      '18.60%',
    ]);
  });
});

describe('skStoreTableColumnShares', () => {
  it('gives the store column the inventory’s share whatever columns follow it', () => {
    const [inventoryStore] = skStoreTableColumnShares([300, 250, 150]);
    const [pendingStore] = skStoreTableColumnShares([200, undefined, 80]);

    expect(inventoryStore).toBe('10.26%');
    expect(pendingStore).toBe(inventoryStore);
  });

  it('splits the rest of the row in irene’s ratios', () => {
    expect(skStoreTableColumnShares([300, 250, 150])).toEqual(
      ireneColumnShares([80, 300, 250, 150])
    );
  });
});
