import { useTranslation } from 'react-i18next';
import { Pin, RefreshCw, X } from 'lucide-react';
import type { Scope } from '@shared/wired';
import { Button, EmptyState, Spinner } from '@/components/ui';
import { WiredFurni, type FurniName } from '@/components/WiredFurni';
import { describeError } from '@/lib/errors';
import { useConsole } from './ConsoleContext';
import { useOpenExplorer } from './navigation';
import { useRoomVariables } from './queries';

const GROUPS: { key: 'users' | 'furni' | 'global'; scope: Scope; furni: FurniName }[] = [
  { key: 'users', scope: 'user', furni: 'user' },
  { key: 'furni', scope: 'furni', furni: 'furni' },
  { key: 'global', scope: 'global', furni: 'room' },
];

function Pins() {
  const { t } = useTranslation();
  const { state, removePin } = useConsole();
  const openExplorer = useOpenExplorer();

  return (
    <section className="card p-5">
      <h2 className="field-label flex items-center gap-2">
        <Pin className="size-3.5" aria-hidden />
        {t('overview.pinned')}
      </h2>
      {state.pins.length === 0 ? (
        <p className="mt-3 text-sm text-sky-200/40">{t('overview.noPins')}</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {state.pins.map((pin) => (
            <li
              key={pin.id}
              className="flex items-center rounded-xl border border-sky-400/20 bg-sky-400/[0.06]"
            >
              <button
                type="button"
                onClick={() =>
                  openExplorer({
                    scope: pin.scope,
                    variable: pin.variable,
                    kind: pin.targetKind,
                    entity: pin.entityId,
                  })
                }
                className="flex items-center gap-2 py-1.5 pr-1 pl-3 text-sm font-semibold text-sky-100 hover:text-white"
              >
                {pin.label ?? pin.variable}
                <span className="text-xs font-normal text-sky-300/70">
                  {t(`scopes.${pin.scope}`)}
                  {pin.targetKind && ` · ${t(`targetKinds.${pin.targetKind}`)}`}
                  {pin.entityId && ` #${pin.entityId}`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => removePin(pin.id)}
                className="mr-1 rounded-md p-1 text-sky-300/60 hover:bg-white/[0.06] hover:text-white"
                aria-label={t('overview.unpin')}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function OverviewTab() {
  const { t } = useTranslation();
  const variables = useRoomVariables();
  const openExplorer = useOpenExplorer();

  return (
    <div className="flex flex-col gap-4">
      <Pins />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{t('overview.title')}</h2>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw className="size-3.5" aria-hidden />}
          loading={variables.isFetching}
          onClick={() => variables.refetch()}
        >
          {t('common.refresh')}
        </Button>
      </div>

      {variables.isPending ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : variables.error ? (
        <div className="card">
          <EmptyState title={describeError(variables.error, t)} />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {GROUPS.map(({ key, scope, furni }) => {
            const names = variables.data[key] ?? [];
            return (
              <section key={key} className="card flex flex-col p-5">
                <header className="flex items-center gap-3">
                  <WiredFurni name={furni} size={36} />
                  <div>
                    <h3 className="font-bold text-white">{t(`overview.${key}`)}</h3>
                    <p className="text-xs text-sky-200/40">{names.length}</p>
                  </div>
                </header>
                {names.length === 0 ? (
                  <p className="mt-4 text-sm text-sky-200/40">{t('overview.none')}</p>
                ) : (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {names.map((name) => (
                      <li key={name}>
                        <button
                          type="button"
                          onClick={() => openExplorer({ scope, variable: name })}
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-xs text-sky-100 transition hover:border-sky-400/40 hover:text-white"
                        >
                          {name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
