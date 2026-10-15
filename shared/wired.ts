import { z } from 'zod';
import { HOTEL_IDS } from './hotels.js';

export const SCOPES = ['user', 'furni', 'global'] as const;
export type Scope = (typeof SCOPES)[number];
export type EntityScope = Exclude<Scope, 'global'>;

export const USER_TARGET_KINDS = ['users', 'pets', 'bots'] as const;
export const FURNI_TARGET_KINDS = ['furni', 'furni-bc', 'wall-items', 'wall-items-bc'] as const;

export type UserTargetKind = (typeof USER_TARGET_KINDS)[number];
export type FurniTargetKind = (typeof FURNI_TARGET_KINDS)[number];
export type TargetKind = UserTargetKind | FurniTargetKind;

export const TARGET_KINDS_BY_SCOPE = {
  user: USER_TARGET_KINDS,
  furni: FURNI_TARGET_KINDS,
} as const satisfies Record<EntityScope, readonly TargetKind[]>;

export function isTargetKindOf(scope: EntityScope, kind: string): kind is TargetKind {
  return (TARGET_KINDS_BY_SCOPE[scope] as readonly string[]).includes(kind);
}

export const roomIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const entityIdSchema = z.string().regex(/^\d{1,19}$/);
export const variableNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[^\s/\\?#%]+$/);
export const variableValueSchema = z.string().regex(/^-?\d{1,19}$/);
export const wiredKeySchema = z.string().regex(/^[A-Za-z0-9_-]{16,128}$/);

const pinSchema = z.object({
  id: z.uuid(),
  label: z.string().trim().max(48).optional(),
  scope: z.enum(SCOPES),
  variable: variableNameSchema,
  targetKind: z.enum([...USER_TARGET_KINDS, ...FURNI_TARGET_KINDS]).optional(),
  entityId: entityIdSchema.optional(),
});

const activitySchema = z.object({
  id: z.uuid(),
  at: z.iso.datetime(),
  method: z.enum(['GET', 'PUT', 'PATCH', 'POST', 'DELETE']),
  path: z.string().max(300),
  status: z.number().int().min(0).max(599),
  durationMs: z.number().int().nonnegative(),
});

export const MAX_PINS = 100;
export const MAX_ACTIVITY = 200;

export const workspaceStateSchema = z.object({
  pins: z.array(pinSchema).max(MAX_PINS).default([]),
  activity: z.array(activitySchema).max(MAX_ACTIVITY).default([]),
});

export const workspaceMetaSchema = z.object({
  name: z.string().trim().min(1).max(48),
  hotel: z.enum(HOTEL_IDS),
  roomId: roomIdSchema,
});

export const workspaceKeysSchema = z.object({
  readKey: wiredKeySchema.nullable(),
  writeKey: wiredKeySchema.nullable(),
});

export const workspaceUpsertSchema = workspaceMetaSchema.extend({
  readKey: wiredKeySchema.nullable().optional(),
  writeKey: wiredKeySchema.nullable().optional(),
  state: workspaceStateSchema,
});

export type Pin = z.infer<typeof pinSchema>;
export type ActivityEntry = z.infer<typeof activitySchema>;
export type WorkspaceState = z.infer<typeof workspaceStateSchema>;
export type WorkspaceMeta = z.infer<typeof workspaceMetaSchema>;
export type WorkspaceKeys = z.infer<typeof workspaceKeysSchema>;
export type WorkspaceUpsert = z.infer<typeof workspaceUpsertSchema>;

export interface WorkspaceSummary extends WorkspaceMeta {
  id: string;
  hasReadKey: boolean;
  hasWriteKey: boolean;
  updatedAt: string;
}

export interface Workspace extends WorkspaceSummary, WorkspaceKeys {
  state: WorkspaceState;
}

export const emptyWorkspaceState = (): WorkspaceState => ({ pins: [], activity: [] });

export interface SessionUser {
  id: string;
  username: string;
  hotel: string;
}
