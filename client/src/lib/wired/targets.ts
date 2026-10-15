import type { ProfileTarget } from './types';

const TARGET_KEYS = [
  'user',
  'pet',
  'bot',
  'furni',
  'furni_bc',
  'wall_item',
  'wall_item_bc',
] as const;

export function targetOf(payload: Record<string, unknown>): ProfileTarget | null {
  const key = TARGET_KEYS.find((candidate) => candidate in payload);
  return key ? (payload[key] as ProfileTarget) : null;
}
