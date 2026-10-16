import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Pin, Search, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import {
  entityIdSchema,
  isTargetKindOf,
  SCOPES,
  TARGET_KINDS_BY_SCOPE,
  variableNameSchema,
  type EntityScope,
  type Scope,
  type TargetKind,
} from '@shared/wired';
import { ConfirmButton } from '@/components/ConfirmButton';
import { Button, EmptyState, Field, Input, Select, Spinner } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { toApiEntityId, toGameEntityId } from '@/lib/wired/ids';
import type { EntityRef, ListQuery } from '@/lib/wired/types';
import { useConsole } from './ConsoleContext';
import { toValueRow } from './items';
import { useRoomVariables, wiredKey } from './queries';
import { ValueEditor } from './ValueEditor';

const PAGE_SIZES = [25, 50, 100] as const;
const VARIABLE_GROUP = { user: 'users', furni: 'furni', global: 'global' } as const;

function parseScope(value: string | null): Scope {
  return SCOPES.find((scope) => scope === value) ?? 'user';
}

function PinToggle(props: {
  scope: Scope;
  variable: string;
  targetKind?: TargetKind;
  entityId?: string;
}) {
  const { t } = useTranslation();
  const { findPin, togglePin } = useConsole();
  const pinned = Boolean(findPin(props));
  return (
    <Button
      variant={pinned ? 'secondary' : 'ghost'}
      size="sm"
      icon={<Pin className={clsx('size-3.5', pinned && 'fill-current text-sky-600')} aria-hidden />}
      onClick={() => togglePin(props)}
      aria-pressed={pinned}
    >
      {pinned ? t('explorer.pinned') : t('explorer.pin')}
    </Button>
  );
}

function useValueMutations(scope: Scope, variable: string, targetKind?: TargetKind) {
  const { workspace, client } = useConsole();
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: wiredKey(workspace.id, 'values', scope, variable, targetKind),
    });

  const update = useMutation({
    mutationFn: ({ ref, value }: { ref: EntityRef; value: string }) =>
      client.updateValue(ref, variable, value),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (ref: EntityRef) => client.deleteValue(ref, variable),
    onSuccess: invalidate,
  });
  return { update, remove };
}

function EntityLookup({
  scope,
  variable,
  targetKind,
  initialEntity,
}: {
  scope: EntityScope;
  variable: string;
  targetKind: TargetKind;
  initialEntity: string | null;
}) {
  const { t } = useTranslation();
  const { workspace, client } = useConsole();
  const [draft, setDraft] = useState(
    initialEntity ? toGameEntityId(targetKind, initialEntity) : '',
  );
  const [entityId, setEntityId] = useState(initialEntity);
  const { update, remove } = useValueMutations(scope, variable, targetKind);
  const ref: EntityRef | null = entityId ? { scope, targetKind, entityId } : null;

  const value = useQuery({
    queryKey: wiredKey(workspace.id, 'values', scope, variable, targetKind, 'entity', entityId),
    queryFn: () => client.getValue(ref as EntityRef, variable),
    enabled: ref !== null,
    retry: false,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const apiId = toApiEntityId(targetKind, draft);
    if (apiId && entityIdSchema.safeParse(apiId).success) setEntityId(apiId);
  };

  return (
    <section className="surface p-5">
      <h3 className="text-sm font-bold text-ink">{t('explorer.lookup')}</h3>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value.replace(/[^\d-]/g, ''))}
          placeholder={t('explorer.entityId')}
          aria-label={t('explorer.entityId')}
          inputMode="numeric"
          className="max-w-xs"
        />
        <Button type="submit" variant="secondary" icon={<Search className="size-4" aria-hidden />}>
          {t('explorer.find')}
        </Button>
      </form>

      {ref && (
        <div className="mt-4 rounded-xl border border-line bg-field p-4">
          {value.isPending ? (
            <Spinner />
          ) : value.error ? (
            <p className="text-sm text-red-500">{describeError(value.error, t)}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="text-sm text-slate-500">
                #{toGameEntityId(targetKind, ref.entityId)}
              </span>
              <ValueEditor
                value={value.data.value}
                canEdit={client.hasWriteKey}
                saving={update.isPending}
                onSave={(next) => update.mutate({ ref, value: next })}
              />
              <span className="text-xs text-slate-400">{value.data.update_time}</span>
              <div className="ml-auto flex items-center gap-2">
                <PinToggle
                  scope={scope}
                  variable={variable}
                  targetKind={targetKind}
                  entityId={ref.entityId}
                />
                {client.hasWriteKey && (
                  <ConfirmButton
                    size="sm"
                    question={t('explorer.deleteConfirm', {
                      variable,
                      entity: toGameEntityId(targetKind, ref.entityId),
                    })}
                    confirmLabel={t('common.delete')}
                    loading={remove.isPending}
                    icon={<Trash2 className="size-3.5" aria-hidden />}
                    onConfirm={() => remove.mutate(ref)}
                  >
                    {t('common.delete')}
                  </ConfirmButton>
                )}
              </div>
            </div>
          )}
          {(update.error || remove.error) && (
            <p className="mt-2 text-sm text-red-500">
              {describeError(update.error ?? remove.error, t)}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function ValuesTable({
  scope,
  variable,
  targetKind,
}: {
  scope: EntityScope;
  variable: string;
  targetKind: TargetKind;
}) {
  const { t, i18n } = useTranslation();
  const { workspace, client } = useConsole();
  const [query, setQuery] = useState<Required<ListQuery>>({
    orderBy: 'value',
    orderDir: 'desc',
    page: 1,
    size: 50,
  });
  const { update, remove } = useValueMutations(scope, variable, targetKind);

  const values = useQuery({
    queryKey: wiredKey(workspace.id, 'values', scope, variable, targetKind, 'list', query),
    queryFn: () => client.listValues(scope, variable, targetKind, query),
    placeholderData: keepPreviousData,
    retry: false,
  });
  const count = useQuery({
    queryKey: wiredKey(workspace.id, 'values', scope, variable, targetKind, 'count'),
    queryFn: () => client.countValues(scope, variable, targetKind),
    retry: false,
  });

  const setOption = <K extends keyof ListQuery>(key: K, value: Required<ListQuery>[K]) =>
    setQuery((current) => ({
      ...current,
      [key]: value,
      page: key === 'page' ? (value as number) : 1,
    }));

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(value),
    );

  const rows = values.data?.items.map(toValueRow) ?? [];
  const hasNext = rows.length >= query.size;

  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-wrap items-end gap-3 border-b border-line p-4">
        <Field label={t('explorer.orderBy')} className="w-36">
          {(id) => (
            <Select
              id={id}
              value={query.orderBy}
              onChange={(event) =>
                setOption('orderBy', event.target.value as Required<ListQuery>['orderBy'])
              }
            >
              {(['value', 'creation_time', 'update_time'] as const).map((option) => (
                <option key={option} value={option} className="bg-white">
                  {t(`explorer.orderOptions.${option}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('explorer.orderDir')} className="w-36">
          {(id) => (
            <Select
              id={id}
              value={query.orderDir}
              onChange={(event) => setOption('orderDir', event.target.value as 'asc' | 'desc')}
            >
              {(['desc', 'asc'] as const).map((option) => (
                <option key={option} value={option} className="bg-white">
                  {t(`explorer.directions.${option}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('explorer.pageSize')} className="w-28">
          {(id) => (
            <Select
              id={id}
              value={query.size}
              onChange={(event) => setOption('size', Number(event.target.value))}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size} className="bg-white">
                  {size}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <p className="ml-auto pb-2 text-sm text-slate-500">
          {count.data ? t('explorer.total', { count: count.data.count }) : null}
        </p>
      </div>

      {values.isPending ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : values.error ? (
        <EmptyState title={describeError(values.error, t)} />
      ) : rows.length === 0 ? (
        <EmptyState title={t('explorer.empty')} />
      ) : (
        <div className="overflow-x-auto">
          <table
            className={clsx('w-full text-left text-sm', values.isPlaceholderData && 'opacity-60')}
          >
            <thead className="text-xs text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{t('explorer.entity')}</th>
                <th className="px-4 py-2.5 font-semibold">{t('explorer.value')}</th>
                <th className="hidden px-4 py-2.5 font-semibold md:table-cell">
                  {t('explorer.updated')}
                </th>
                <th className="hidden px-4 py-2.5 font-semibold lg:table-cell">
                  {t('explorer.created')}
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => {
                const ref: EntityRef = { scope, targetKind, entityId: row.entityId };
                return (
                  <tr key={row.entityId} className="hover:bg-sky-50/50">
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-slate-600">
                        #{toGameEntityId(targetKind, row.entityId)}
                      </span>
                      {row.name && <span className="ml-2 font-semibold text-ink">{row.name}</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <ValueEditor
                        value={row.value}
                        canEdit={client.hasWriteKey}
                        saving={update.isPending}
                        onSave={(value) => update.mutate({ ref, value })}
                      />
                    </td>
                    <td className="hidden px-4 py-2.5 text-slate-500 md:table-cell">
                      {formatDate(row.updatedAt)}
                    </td>
                    <td className="hidden px-4 py-2.5 text-slate-500 lg:table-cell">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {client.hasWriteKey && (
                        <ConfirmButton
                          size="sm"
                          question={t('explorer.deleteConfirm', {
                            variable,
                            entity: toGameEntityId(targetKind, row.entityId),
                          })}
                          confirmLabel={t('common.delete')}
                          icon={<Trash2 className="size-3.5" aria-hidden />}
                          onConfirm={() => remove.mutate(ref)}
                        >
                          <span className="sr-only">{t('common.delete')}</span>
                        </ConfirmButton>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(update.error || remove.error) && (
        <p className="px-4 pb-3 text-sm text-red-500">
          {describeError(update.error ?? remove.error, t)}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-line px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronLeft className="size-4" aria-hidden />}
          disabled={query.page <= 1}
          onClick={() => setOption('page', query.page - 1)}
        >
          {t('explorer.previous')}
        </Button>
        <span className="text-xs text-slate-400">{t('explorer.page', { page: query.page })}</span>
        <Button
          variant="ghost"
          size="sm"
          disabled={!hasNext}
          onClick={() => setOption('page', query.page + 1)}
        >
          {t('explorer.next')}
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </section>
  );
}

function GlobalValue({ variable }: { variable: string }) {
  const { t } = useTranslation();
  const { workspace, client } = useConsole();
  const queryClient = useQueryClient();
  const key = wiredKey(workspace.id, 'values', 'global', variable);

  const value = useQuery({
    queryKey: key,
    queryFn: () => client.getGlobal(variable),
    retry: false,
  });
  const update = useMutation({
    mutationFn: (next: string) => client.updateGlobal(variable, next),
    onSuccess: (data) => queryClient.setQueryData(key, data),
  });

  return (
    <section className="surface flex flex-wrap items-center gap-4 p-5">
      <span className="font-mono text-sm text-slate-600">{variable}</span>
      {value.isPending ? (
        <Spinner />
      ) : value.error ? (
        <p className="text-sm text-red-500">{describeError(value.error, t)}</p>
      ) : (
        <ValueEditor
          value={value.data.value}
          canEdit={client.hasWriteKey}
          saving={update.isPending}
          onSave={(next) => update.mutate(next)}
        />
      )}
      <div className="ml-auto">
        <PinToggle scope="global" variable={variable} />
      </div>
      {update.error && (
        <p className="w-full text-sm text-red-500">{describeError(update.error, t)}</p>
      )}
    </section>
  );
}

export function ExplorerTab() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const variables = useRoomVariables();

  const scope = parseScope(params.get('scope'));
  const variable = params.get('variable') ?? '';
  const kindParam = params.get('kind') ?? '';
  const targetKind: TargetKind | null =
    scope === 'global'
      ? null
      : isTargetKindOf(scope, kindParam)
        ? kindParam
        : TARGET_KINDS_BY_SCOPE[scope][0];

  const [draft, setDraft] = useState(variable);
  const suggestions = variables.data?.[VARIABLE_GROUP[scope]] ?? [];

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    next.set('tab', 'explorer');
    for (const [name, value] of Object.entries(changes)) {
      if (value === null) next.delete(name);
      else next.set(name, value);
    }
    setParams(next);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (variableNameSchema.safeParse(draft).success) update({ variable: draft, entity: null });
  };

  const validVariable = variableNameSchema.safeParse(variable).success;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="surface flex flex-wrap items-end gap-3 p-4">
        <Field label={t('explorer.scope')} className="w-36">
          {(id) => (
            <Select
              id={id}
              value={scope}
              onChange={(event) => update({ scope: event.target.value, kind: null, entity: null })}
            >
              {SCOPES.map((option) => (
                <option key={option} value={option} className="bg-white">
                  {t(`scopes.${option}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('explorer.variable')} className="min-w-48 flex-1">
          {(id) => (
            <>
              <Input
                id={id}
                list={`${id}-suggestions`}
                value={draft}
                onChange={(event) => setDraft(event.target.value.trim())}
                placeholder={t('explorer.variablePlaceholder')}
                className="font-mono"
              />
              <datalist id={`${id}-suggestions`}>
                {suggestions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </>
          )}
        </Field>
        {scope !== 'global' && targetKind && (
          <Field label={t('explorer.targetKind')} className="w-48">
            {(id) => (
              <Select
                id={id}
                value={targetKind}
                onChange={(event) => update({ kind: event.target.value, entity: null })}
              >
                {TARGET_KINDS_BY_SCOPE[scope].map((kind) => (
                  <option key={kind} value={kind} className="bg-white">
                    {t(`targetKinds.${kind}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Button type="submit">{t('explorer.load')}</Button>
      </form>

      {!validVariable ? (
        <div className="surface">
          <EmptyState title={t('explorer.pick')} />
        </div>
      ) : scope === 'global' || !targetKind ? (
        <GlobalValue key={variable} variable={variable} />
      ) : (
        <>
          <div className="flex justify-end">
            <PinToggle scope={scope} variable={variable} targetKind={targetKind} />
          </div>
          <EntityLookup
            key={`${scope}:${variable}:${targetKind}:${params.get('entity') ?? ''}`}
            scope={scope}
            variable={variable}
            targetKind={targetKind}
            initialEntity={params.get('entity')}
          />
          <ValuesTable
            key={`${scope}:${variable}:${targetKind}`}
            scope={scope}
            variable={variable}
            targetKind={targetKind}
          />
        </>
      )}
    </div>
  );
}
