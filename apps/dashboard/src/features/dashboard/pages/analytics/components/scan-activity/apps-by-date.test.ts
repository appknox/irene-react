import { describe, expect, it } from 'vitest';

import { buildAppScan } from '@tests/factories';

import { countFilesByDate, groupAppsByDate } from './apps-by-date';

describe('groupAppsByDate', () => {
  it('keys each app by the UTC date it was scanned on', () => {
    const scan = buildAppScan({ created_on_date: '2026-03-04T23:30:00Z', file_count: '3' });

    const byDate = groupAppsByDate([scan]);

    expect([...byDate.keys()]).toEqual(['2026-03-04']);

    expect(byDate.get('2026-03-04')).toEqual([
      { packageName: scan.package_name, platform: scan.platform, count: 3 },
    ]);
  });

  it('counts an app scanned more than once on a date as one entry', () => {
    const packageName = 'com.example.app';

    const byDate = groupAppsByDate([
      buildAppScan({
        created_on_date: '2026-03-04T01:00:00Z',
        package_name: packageName,
        file_count: '2',
      }),
      buildAppScan({
        created_on_date: '2026-03-04T22:00:00Z',
        package_name: packageName,
        file_count: '5',
      }),
    ]);

    expect(byDate.get('2026-03-04')).toEqual([{ packageName, platform: '0', count: 7 }]);
  });

  it('orders the apps of a date busiest first', () => {
    const byDate = groupAppsByDate([
      buildAppScan({
        created_on_date: '2026-03-04T01:00:00Z',
        package_name: 'quiet',
        file_count: '1',
      }),
      buildAppScan({
        created_on_date: '2026-03-04T02:00:00Z',
        package_name: 'busy',
        file_count: '9',
      }),
    ]);

    expect(byDate.get('2026-03-04')?.map((app) => app.packageName)).toEqual(['busy', 'quiet']);
  });

  it('keeps each date apart', () => {
    const byDate = groupAppsByDate([
      buildAppScan({ created_on_date: '2026-03-04T01:00:00Z' }),
      buildAppScan({ created_on_date: '2026-03-05T01:00:00Z' }),
    ]);

    expect([...byDate.keys()]).toEqual(['2026-03-04', '2026-03-05']);
  });

  it('answers nothing for nothing scanned', () => {
    expect(groupAppsByDate([]).size).toBe(0);
  });
});

describe('countFilesByDate', () => {
  it('adds up every app scanned on a date', () => {
    const byDate = groupAppsByDate([
      buildAppScan({
        created_on_date: '2026-03-04T01:00:00Z',
        package_name: 'one',
        file_count: '2',
      }),
      buildAppScan({
        created_on_date: '2026-03-04T02:00:00Z',
        package_name: 'two',
        file_count: '5',
      }),
    ]);

    expect(countFilesByDate(byDate)).toEqual([{ day: '2026-03-04', value: 7 }]);
  });

  it('answers one entry per date that had any scanning', () => {
    const byDate = groupAppsByDate([
      buildAppScan({ created_on_date: '2026-03-04T01:00:00Z' }),
      buildAppScan({ created_on_date: '2026-03-06T01:00:00Z' }),
    ]);

    expect(countFilesByDate(byDate)).toHaveLength(2);
  });
});
