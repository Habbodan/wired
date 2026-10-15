import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Button, EmptyState } from '@/components/ui';
import { useConsole } from './ConsoleContext';

const METHOD_TONES: Record<string, string> = {
  GET: 'text-sky-300',
  PUT: 'text-habbo-orange',
  PATCH: 'text-habbo-yellow',
  POST: 'text-violet-300',
  DELETE: 'text-red-300',
};

function statusTone(status: number) {
  if (status === 0 || status >= 500) return 'text-red-300';
  if (status >= 400) return 'text-habbo-orange';
  return 'text-emerald-300';
}

export function ActivityTab() {
  const { t, i18n } = useTranslation();
  const { state, clearActivity } = useConsole();
  const time = new Intl.DateTimeFormat(i18n.language, { timeStyle: 'medium' });

  return (
    <section className="card overflow-hidden">
      <header className="flex items-center justify-between border-b border-white/[0.06] p-4">
        <h2 className="font-bold text-white">{t('activity.title')}</h2>
        <Button
          variant="ghost"
          size="sm"
          disabled={state.activity.length === 0}
          onClick={clearActivity}
        >
          {t('activity.clear')}
        </Button>
      </header>

      {state.activity.length === 0 ? (
        <EmptyState title={t('activity.empty')} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-sky-200/40">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{t('activity.time')}</th>
                <th className="px-4 py-2.5 font-semibold">{t('activity.request')}</th>
                <th className="px-4 py-2.5 font-semibold">{t('activity.status')}</th>
                <th className="hidden px-4 py-2.5 text-right font-semibold sm:table-cell">
                  {t('activity.duration')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] font-mono text-xs">
              {state.activity.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sky-200/40">
                    {time.format(new Date(entry.at))}
                  </td>
                  <td
                    className="max-w-[60vw] truncate px-4 py-2 text-sky-100/80"
                    title={entry.path}
                  >
                    <span className={clsx('mr-2 font-bold', METHOD_TONES[entry.method])}>
                      {entry.method}
                    </span>
                    {entry.path}
                  </td>
                  <td className={clsx('px-4 py-2 font-bold', statusTone(entry.status))}>
                    {entry.status || '—'}
                  </td>
                  <td className="hidden px-4 py-2 text-right text-sky-200/40 sm:table-cell">
                    {entry.durationMs} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
