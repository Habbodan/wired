import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { Button, Field, Input } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { useConsole } from './ConsoleContext';
import { useRoomVariables, wiredKey } from './queries';

export function ToolsTab() {
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
    <section className="surface border-red-200 p-5">
      <header className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-red-500">
          <Trash2 className="size-4" aria-hidden />
        </div>
        <div>
          <h3 className="font-bold text-ink">{t('tools.bulk.title')}</h3>
          <p className="text-sm text-slate-500">{t('tools.bulk.body')}</p>
        </div>
      </header>

      <p className="text-sm font-bold text-ink mt-5">{t('tools.bulk.select')}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {names.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => toggle(name)}
            aria-pressed={selected.includes(name)}
            className={clsx(
              'rounded-full border px-3 py-1 font-mono text-xs transition',
              selected.includes(name)
                ? 'border-red-200 bg-red-50 text-red-500'
                : 'border-sky-100 bg-sky-50 text-sky-800 hover:border-sky-300',
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
        <p className="mt-3 text-sm text-emerald-600">{t('tools.bulk.done')}</p>
      )}
      {bulkDelete.error && (
        <p className="mt-3 text-sm text-red-500">{describeError(bulkDelete.error, t)}</p>
      )}
    </section>
  );
}
