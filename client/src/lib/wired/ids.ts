import type { FurniTargetKind } from '@shared/wired';

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
