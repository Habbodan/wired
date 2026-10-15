import { targetOf } from '@/lib/wired/targets';
import type { PagedItem } from '@/lib/wired/types';

export interface ValueRow {
  entityId: string;
  name: string | undefined;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export function toValueRow(item: PagedItem): ValueRow {
  const target = targetOf(item);
  return {
    entityId: target ? String(target.id) : '?',
    name: target?.name,
    value: item.variable.value,
    createdAt: item.variable.creation_time,
    updatedAt: item.variable.update_time,
  };
}
