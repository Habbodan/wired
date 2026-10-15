import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { FURNI_TARGET_KINDS, type FurniTargetKind } from '@shared/wired';
import { Button, Field, Input, Select } from '@/components/ui';
import { WiredFurni } from '@/components/WiredFurni';
import { describeError } from '@/lib/errors';
import { apiToInGameId, inGameToApiId } from '@/lib/wired/ids';
import { useConsole } from './ConsoleContext';
import { useRoomVariables, wiredKey } from './queries';

function IdConverter() {
  const { t } = useTranslation();
  const [kind, setKind] = useState<FurniTargetKind>('wall-items');
  const [inGame, setInGame] = useState('');
  const [apiId, setApiId] = useState('');

  const convert = (value: string, direction: 'toApi' | 'toGame') => {
    const cleaned = value.replace(/[^\d-]/g, '');
    const parsed = Number(cleaned);
    const valid = cleaned !== '' && cleaned !== '-' && Number.isSafeInteger(parsed);
    if (direction === 'toApi') {
      setInGame(cleaned);
      setApiId(valid ? String(inGameToApiId(kind, parsed)) : '');
    } else {
      setApiId(cleaned);
      setInGame(valid ? String(apiToInGameId(kind, parsed)) : '');
    }
  };

  return (
    <section className="card p-5">
      <header className="flex items-center gap-3">
        <WiredFurni name="valueMatch" size={36} />
        <div>
          <h3 className="font-bold text-white">{t('tools.ids.title')}</h3>
          <p className="text-sm text-sky-200/60">{t('tools.ids.body')}</p>
        </div>
      </header>
      <div className="mt-5 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto_1fr]">
        <Field label={t('tools.ids.kind')}>
          {(id) => (
            <Select
              id={id}
              value={kind}
              onChange={(event) => {
                setKind(event.target.value as FurniTargetKind);
                setInGame('');
                setApiId('');
              }}
            >
              {FURNI_TARGET_KINDS.map((option) => (
                <option key={option} value={option} className="bg-night-900">
                  {t(`targetKinds.${option}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('tools.ids.inGame')}>
          {(id) => (
            <Input
              id={id}
              value={inGame}
              onChange={(event) => convert(event.target.value, 'toApi')}
              className="font-mono"
            />
          )}
        </Field>
        <ArrowLeftRight className="mb-3 hidden size-4 text-sky-200/40 sm:block" aria-hidden />
        <Field label={t('tools.ids.api')}>
          {(id) => (
            <Input
              id={id}
              value={apiId}
              onChange={(event) => convert(event.target.value, 'toGame')}
              className="font-mono"
            />
          )}
        </Field>
      </div>
    </section>
  );
}

function BulkDelete() {
  const { t } = useTranslation();
  const { workspace, client } = useConsole();
  const queryClient = useQueryClient();
  const variables = useRoomVariables();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState('');

  const names = [
    ...new Set([...(variables.data?.users ?? []), ...(variables.data?.furni ?? [])]),
  ].sort();

  const bulkDelete = useMutation({
    mutationFn: () => client.bulkDelete(selected),
    onSuccess: () => {
      setSelected([]);
      setConfirmation('');
      void queryClient.invalidateQueries({ queryKey: wiredKey(workspace.id, 'values') });
    },
  });

  const toggle = (name: string) =>
    setSelected((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );

  const ready = selected.length > 0 && confirmation === String(workspace.roomId);

  return (
    <section className="card border-red-400/15 p-5">
      <header className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
          <Trash2 className="size-4" aria-hidden />
        </div>
        <div>
          <h3 className="font-bold text-white">{t('tools.bulk.title')}</h3>
          <p className="text-sm text-sky-200/60">{t('tools.bulk.body')}</p>
        </div>
      </header>

      <p className="field-label mt-5">{t('tools.bulk.select')}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {names.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => toggle(name)}
            aria-pressed={selected.includes(name)}
            className={clsx(
              'rounded-lg border px-2.5 py-1 font-mono text-xs transition',
              selected.includes(name)
                ? 'border-red-400/50 bg-red-500/15 text-red-100'
                : 'border-white/10 bg-white/[0.03] text-sky-100/80 hover:text-white',
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label={t('tools.bulk.confirm', { roomId: workspace.roomId })} className="sm:w-72">
          {(id) => (
            <Input
              id={id}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value.trim())}
              inputMode="numeric"
              autoComplete="off"
            />
          )}
        </Field>
        <Button
          variant="danger"
          disabled={!ready || !client.hasWriteKey}
          loading={bulkDelete.isPending}
          onClick={() => bulkDelete.mutate()}
        >
          {t('tools.bulk.action')}
        </Button>
      </div>

      {bulkDelete.isSuccess && (
        <p className="mt-3 text-sm text-emerald-300">{t('tools.bulk.done')}</p>
      )}
      {bulkDelete.error && (
        <p className="mt-3 text-sm text-red-300">{describeError(bulkDelete.error, t)}</p>
      )}
    </section>
  );
}

export function ToolsTab() {
  return (
    <div className="flex flex-col gap-4">
      <IdConverter />
      <BulkDelete />
    </div>
  );
}
