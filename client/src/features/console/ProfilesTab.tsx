import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Search, Trash2, X } from 'lucide-react';
import clsx from 'clsx';
import {
  entityIdSchema,
  FURNI_TARGET_KINDS,
  USER_TARGET_KINDS,
  variableValueSchema,
  type EntityScope,
  type TargetKind,
} from '@shared/wired';
import { ConfirmButton } from '@/components/ConfirmButton';
import { Button, EmptyState, Field, Input, Select, Spinner } from '@/components/ui';
import { describeError } from '@/lib/errors';
import type { EntityProfile } from '@/lib/wired/types';
import { useConsole } from './ConsoleContext';
import { wiredKey } from './queries';

type Mode = 'userName' | 'userUniqueId' | 'entity' | 'global';

type Lookup =
  | { mode: 'userName'; name: string }
  | { mode: 'userUniqueId'; uniqueId: string }
  | { mode: 'entity'; scope: EntityScope; kind: TargetKind; entityId: string }
  | { mode: 'global' };

interface PatchTarget {
  scope: EntityScope | 'global';
  kind?: TargetKind;
  entityId?: string;
}

const ENTITY_KINDS = [...USER_TARGET_KINDS, ...FURNI_TARGET_KINDS];
const scopeOfKind = (kind: TargetKind): EntityScope =>
  (USER_TARGET_KINDS as readonly string[]).includes(kind) ? 'user' : 'furni';

function patchTargetOf(lookup: Lookup, profile: EntityProfile): PatchTarget | null {
  switch (lookup.mode) {
    case 'global':
      return { scope: 'global' };
    case 'entity':
      return { scope: lookup.scope, kind: lookup.kind, entityId: lookup.entityId };
    default:
      return profile.target
        ? { scope: 'user', kind: 'users', entityId: String(profile.target.id) }
        : null;
  }
}

function ProfileEditor({ lookup, profile }: { lookup: Lookup; profile: EntityProfile }) {
  const { t, i18n } = useTranslation();
  const { workspace, client } = useConsole();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string | null>>({});
  const target = patchTargetOf(lookup, profile);
  const canEdit = client.hasWriteKey && target !== null;

  const changes = Object.entries(drafts).filter(
    ([name, value]) => value !== profile.variables[name]?.value,
  );
  const invalid = changes.some(
    ([, value]) => value !== null && !variableValueSchema.safeParse(value).success,
  );

  const save = useMutation({
    mutationFn: (variables: Record<string, string | null>) => {
      if (!target) throw new Error('Profile has no target');
      return target.scope === 'global'
        ? client.patchGlobalProfile(variables)
        : client.patchProfile(
            target.scope,
            target.kind as TargetKind,
            target.entityId as string,
            variables,
          );
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(wiredKey(workspace.id, 'profile', lookup), updated);
      setDrafts({});
    },
  });

  const removeProfile = useMutation({
    mutationFn: () =>
      client.deleteUserProfile(target?.kind as TargetKind, target?.entityId as string),
    onSuccess: () =>
      queryClient.removeQueries({ queryKey: wiredKey(workspace.id, 'profile', lookup) }),
  });

  const names = Object.keys(profile.variables).sort((a, b) => a.localeCompare(b));
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(value),
    );

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] p-4">
        {profile.target ? (
          <p className="text-sm">
            <span className="font-mono text-sky-200/60">#{profile.target.id}</span>
            {profile.target.name && (
              <span className="ml-2 font-bold text-white">{profile.target.name}</span>
            )}
          </p>
        ) : (
          <p className="text-sm font-bold text-white">{t('profiles.modes.global')}</p>
        )}
        {canEdit && target?.scope === 'user' && (
          <div className="ml-auto">
            <ConfirmButton
              size="sm"
              question={t('profiles.deleteProfileConfirm')}
              confirmLabel={t('common.delete')}
              loading={removeProfile.isPending}
              icon={<Trash2 className="size-3.5" aria-hidden />}
              onConfirm={() => removeProfile.mutate()}
            >
              {t('profiles.deleteProfile')}
            </ConfirmButton>
          </div>
        )}
      </header>

      {names.length === 0 ? (
        <EmptyState title={t('profiles.noVariables')} />
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {names.map((name) => {
            const variable = profile.variables[name];
            if (!variable) return null;
            const draft = drafts[name];
            const removed = draft === null;
            return (
              <li key={name} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <span
                  className={clsx(
                    'min-w-40 font-mono text-sm',
                    removed ? 'text-red-300 line-through' : 'text-sky-100',
                  )}
                >
                  {name}
                </span>
                {canEdit ? (
                  <Input
                    value={removed ? '' : (draft ?? variable.value)}
                    disabled={removed}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [name]: event.target.value.replace(/[^\d-]/g, ''),
                      }))
                    }
                    inputMode="numeric"
                    aria-label={name}
                    className="h-8 w-36 font-mono"
                  />
                ) : (
                  <span className="font-mono text-sm font-semibold text-white">
                    {variable.value}
                  </span>
                )}
                <span className="hidden text-xs text-sky-200/40 sm:inline">
                  {formatDate(variable.update_time)}
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      setDrafts((current) =>
                        removed
                          ? Object.fromEntries(
                              Object.entries(current).filter(([key]) => key !== name),
                            )
                          : { ...current, [name]: null },
                      )
                    }
                    className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-sky-200/60 hover:bg-white/[0.06] hover:text-white"
                  >
                    {removed ? (
                      <RotateCcw className="size-3.5" aria-hidden />
                    ) : (
                      <X className="size-3.5" aria-hidden />
                    )}
                    {removed ? t('profiles.undo') : t('profiles.remove')}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(save.error || removeProfile.error) && (
        <p className="px-4 pt-3 text-sm text-red-300">
          {describeError(save.error ?? removeProfile.error, t)}
        </p>
      )}

      {changes.length > 0 && (
        <footer className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-white/[0.06] bg-night-900/95 p-4 backdrop-blur">
          <span className="text-sm text-habbo-orange">
            {t('profiles.pending', { count: changes.length })}
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDrafts({})}>
              {t('profiles.discard')}
            </Button>
            <Button
              size="sm"
              loading={save.isPending}
              disabled={invalid}
              onClick={() => save.mutate(Object.fromEntries(changes))}
            >
              {t('profiles.saveChanges')}
            </Button>
          </div>
        </footer>
      )}
    </section>
  );
}

export function ProfilesTab() {
  const { t } = useTranslation();
  const { workspace, client } = useConsole();
  const [mode, setMode] = useState<Mode>('userName');
  const [name, setName] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [kind, setKind] = useState<TargetKind>('users');
  const [entityId, setEntityId] = useState('');
  const [lookup, setLookup] = useState<Lookup | null>(null);

  const profile = useQuery({
    queryKey: wiredKey(workspace.id, 'profile', lookup),
    queryFn: () => {
      const current = lookup as Lookup;
      switch (current.mode) {
        case 'userName':
          return client.findUserProfile({ name: current.name });
        case 'userUniqueId':
          return client.findUserProfile({ uniqueId: current.uniqueId });
        case 'entity':
          return client.getProfile(current.scope, current.kind, current.entityId);
        case 'global':
          return client.getGlobalProfile();
      }
    },
    enabled: lookup !== null,
    retry: false,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === 'userName' && name.trim()) setLookup({ mode, name: name.trim() });
    if (mode === 'userUniqueId' && uniqueId.trim()) setLookup({ mode, uniqueId: uniqueId.trim() });
    if (mode === 'entity' && entityIdSchema.safeParse(entityId).success) {
      setLookup({ mode, scope: scopeOfKind(kind), kind, entityId });
    }
    if (mode === 'global') setLookup({ mode });
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="card flex flex-wrap items-end gap-3 p-4">
        <Field label={t('profiles.mode')} className="w-52">
          {(id) => (
            <Select id={id} value={mode} onChange={(event) => setMode(event.target.value as Mode)}>
              {(['userName', 'userUniqueId', 'entity', 'global'] as const).map((option) => (
                <option key={option} value={option} className="bg-night-900">
                  {t(`profiles.modes.${option}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        {mode === 'userName' && (
          <Field label={t('profiles.name')} className="min-w-48 flex-1">
            {(id) => (
              <Input
                id={id}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={32}
              />
            )}
          </Field>
        )}
        {mode === 'userUniqueId' && (
          <Field label={t('profiles.uniqueId')} className="min-w-48 flex-1">
            {(id) => (
              <Input
                id={id}
                value={uniqueId}
                onChange={(event) => setUniqueId(event.target.value)}
                placeholder="hhtr-…"
                className="font-mono"
              />
            )}
          </Field>
        )}
        {mode === 'entity' && (
          <>
            <Field label={t('profiles.kind')} className="w-48">
              {(id) => (
                <Select
                  id={id}
                  value={kind}
                  onChange={(event) => setKind(event.target.value as TargetKind)}
                >
                  {ENTITY_KINDS.map((option) => (
                    <option key={option} value={option} className="bg-night-900">
                      {t(`targetKinds.${option}`)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t('profiles.entityId')} className="min-w-36 flex-1">
              {(id) => (
                <Input
                  id={id}
                  value={entityId}
                  onChange={(event) => setEntityId(event.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                />
              )}
            </Field>
          </>
        )}

        <Button type="submit" icon={<Search className="size-4" aria-hidden />}>
          {t('profiles.lookup')}
        </Button>
      </form>

      {lookup &&
        (profile.isPending ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : profile.error ? (
          <div className="card">
            <EmptyState title={describeError(profile.error, t)} />
          </div>
        ) : (
          <ProfileEditor key={JSON.stringify(lookup)} lookup={lookup} profile={profile.data} />
        ))}
    </div>
  );
}
