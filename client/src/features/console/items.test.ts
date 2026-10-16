import { describe, expect, it } from 'vitest';
import { toValueRow } from './items';

describe('toValueRow', () => {
  it('reads the shape returned by the list endpoint', () => {
    const row = toValueRow({
      variable: {
        value: '700',
        creation_time: '2026-10-13T15:47:52.707Z',
        update_time: '2026-10-13T15:51:09.469Z',
      },
      user: { unique_id: 'hhtr-abc', name: 'frank', id: 1087347 },
    });

    expect(row).toEqual({
      entityId: '1087347',
      name: 'frank',
      value: '700',
      createdAt: '2026-10-13T15:47:52.707Z',
      updatedAt: '2026-10-13T15:51:09.469Z',
    });
  });

  it('handles targets without a name', () => {
    const row = toValueRow({
      variable: { value: '-3', creation_time: 'a', update_time: 'b' },
      wall_item: { id: 42 },
    });

    expect(row.entityId).toBe('42');
    expect(row.name).toBeUndefined();
  });
});
