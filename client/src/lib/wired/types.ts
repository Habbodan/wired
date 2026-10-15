import type { EntityScope, FurniTargetKind, TargetKind, UserTargetKind } from '@shared/wired';

export interface RoomVariables {
  users: string[];
  furni: string[];
  global: string[];
}

export interface WiredVariable {
  value: string;
  creation_time: string;
  update_time: string;
}

export type VariableMap = Record<string, WiredVariable>;

export interface PagedItem {
  variable: WiredVariable;
  [target: string]: unknown;
}

export interface PagedValues {
  items: PagedItem[];
  page: number;
  size: number;
}

export interface ListQuery {
  orderBy?: 'value' | 'creation_time' | 'update_time';
  orderDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

export interface ProfileTarget {
  id: number;
  name?: string;
  unique_id?: string;
}

export interface EntityProfile {
  variables: VariableMap;
  target: ProfileTarget | null;
}

export type BatchOperation =
  | { op_id?: string; method: 'GET' | 'DELETE'; path: string }
  | { op_id?: string; method: 'PUT' | 'PATCH'; path: string; body: { value: string } };

export type BatchResult =
  | { op_id?: string; status: 200; body: WiredVariable }
  | { op_id?: string; status: 204 }
  | { op_id?: string; status: number; error: { code: string; message: string } };

export interface EntityRef {
  scope: EntityScope;
  targetKind: TargetKind;
  entityId: string;
}

export type UserProfileLookup = { name: string } | { uniqueId: string };

export type { EntityScope, FurniTargetKind, TargetKind, UserTargetKind };
