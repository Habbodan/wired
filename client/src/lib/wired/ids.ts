import { FURNI_TARGET_KINDS, type FurniTargetKind } from '@shared/wired';

export const BC_ID_OFFSET = 0x7fffffff - 0xffff;

export function inGameToApiId(kind: FurniTargetKind, inGameId: number): number {
  switch (kind) {
    case 'furni':
      return inGameId;
    case 'wall-items':
      return -inGameId;
    case 'furni-bc':
      return inGameId - BC_ID_OFFSET;
    case 'wall-items-bc':
      return -inGameId - BC_ID_OFFSET;
  }
}

export function apiToInGameId(kind: FurniTargetKind, apiId: number): number {
  switch (kind) {
    case 'furni':
      return apiId;
    case 'wall-items':
      return -apiId;
    case 'furni-bc':
      return apiId + BC_ID_OFFSET;
    case 'wall-items-bc':
      return -(apiId + BC_ID_OFFSET);
  }
}

const isFurniKind = (kind: string): kind is FurniTargetKind =>
  (FURNI_TARGET_KINDS as readonly string[]).includes(kind);

export function toApiEntityId(kind: string, inGameId: string): string | null {
  if (!/^-?\d{1,19}$/.test(inGameId)) return null;
  if (!isFurniKind(kind)) return inGameId.startsWith('-') ? null : inGameId;
  const parsed = Number(inGameId);
  if (!Number.isSafeInteger(parsed)) return null;
  const apiId = inGameToApiId(kind, parsed);
  return apiId >= 0 ? String(apiId) : null;
}

export function toGameEntityId(kind: string, apiId: string): string {
  if (!isFurniKind(kind)) return apiId;
  const parsed = Number(apiId);
  return Number.isSafeInteger(parsed) ? String(apiToInGameId(kind, parsed)) : apiId;
}
