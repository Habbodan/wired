import { Link, useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Activity,
  Compass,
  LayoutGrid,
  Settings,
  UserSearch,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { findHotel } from '@shared/hotels';
import type { Workspace } from '@shared/wired';
import { NightSky } from '@/components/NightSky';
import { buttonClass, EmptyState, Pill, Spinner } from '@/components/ui';
import { WiredFurni } from '@/components/WiredFurni';
import { describeError } from '@/lib/errors';
import { useWorkspace } from '@/features/workspaces/hooks';
import { ActivityTab } from './ActivityTab';
import { ConsoleProvider } from './ConsoleContext';
import { ExplorerTab } from './ExplorerTab';
import { CONSOLE_TABS, parseTab, type ConsoleTab } from './navigation';
import { OverviewTab } from './OverviewTab';
import { ProfilesTab } from './ProfilesTab';
import { ToolsTab } from './ToolsTab';

const TAB_ICONS: Record<ConsoleTab, LucideIcon> = {
  overview: LayoutGrid,
  explorer: Compass,
  profiles: UserSearch,
  tools: Wrench,
  activity: Activity,
};

function Console({ workspace }: { workspace: Workspace }) {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const tab = parseTab(params.get('tab'));

  return (
    <ConsoleProvider workspace={workspace}>
      <section className="relative min-h-[80vh]">
        <NightSky className="h-[360px]" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-16 pb-12 md:px-6 md:pt-20">
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 flex flex-col gap-6 md:flex-row md:items-end"
          >
            <div className="flex min-w-0 items-center gap-5">
              <div className="glass flex size-20 shrink-0 items-center justify-center rounded-3xl">
                <WiredFurni name="webApi" size={52} className="drop-shadow-xl" />
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-2">
                  <Pill>{findHotel(workspace.hotel)?.name}</Pill>
                  <Pill>{t('workspaces.room', { id: workspace.roomId })}</Pill>
                  {workspace.readKey && <Pill tone="sky">{t('workspaces.readKey')}</Pill>}
                  {workspace.writeKey && <Pill tone="orange">{t('workspaces.writeKey')}</Pill>}
                </div>
                <h1 className="truncate text-4xl font-black tracking-tight text-white md:text-5xl">
                  {workspace.name}
                </h1>
              </div>
            </div>
            <Link
              to={`/w/${workspace.id}/settings`}
              className={buttonClass('secondary', 'md', 'md:ml-auto')}
            >
              <Settings className="size-4" />
              {t('console.settings')}
            </Link>
          </motion.header>

          {!workspace.readKey ? (
            <div className="card">
              <EmptyState
                icon={<WiredFurni name="webApi" size={64} />}
                title={t('console.noReadKey')}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {!workspace.writeKey && (
                <p className="rounded-2xl border border-habbo-orange/20 bg-habbo-orange/10 px-5 py-3 text-sm font-medium text-orange-200">
                  {t('console.readOnly')}
                </p>
              )}

              <nav role="tablist" className="glass flex gap-1 overflow-x-auto rounded-2xl p-1.5">
                {CONSOLE_TABS.map((name) => {
                  const Icon = TAB_ICONS[name];
                  const active = tab === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setParams({ tab: name })}
                      className={clsx(
                        'relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors',
                        active ? 'text-white' : 'text-sky-200/60 hover:text-sky-100',
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="console-tab"
                          className="absolute inset-0 rounded-xl bg-sky-500/20 ring-1 ring-sky-400/30"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <Icon className={clsx('relative size-4', active && 'text-sky-300')} />
                      <span className="relative">{t(`console.tabs.${name}`)}</span>
                    </button>
                  );
                })}
              </nav>

              <div role="tabpanel">
                {tab === 'overview' && <OverviewTab />}
                {tab === 'explorer' && <ExplorerTab key={params.get('variable') ?? ''} />}
                {tab === 'profiles' && <ProfilesTab />}
                {tab === 'tools' && <ToolsTab />}
                {tab === 'activity' && <ActivityTab />}
              </div>
            </div>
          )}
        </div>
      </section>
    </ConsoleProvider>
  );
}

export function ConsolePage() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const workspace = useWorkspace(id);

  if (workspace.isPending) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    );
  }

  if (!workspace.data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-32">
        <div className="card">
          <EmptyState
            icon={<WiredFurni name="echo" size={64} />}
            title={workspace.error ? describeError(workspace.error, t) : t('console.notFound')}
          >
            <Link to="/workspaces" className={buttonClass('secondary', 'sm')}>
              {t('nav.workspaces')}
            </Link>
          </EmptyState>
        </div>
      </div>
    );
  }

  return <Console key={workspace.data.id} workspace={workspace.data} />;
}
