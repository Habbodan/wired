import { Link, useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Compass,
  Eye,
  LayoutGrid,
  PencilLine,
  Settings,
  TriangleAlert,
  UserSearch,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { findHotel } from '@shared/hotels';
import type { Workspace } from '@shared/wired';
import { FurniStage } from '@/components/FurniStage';
import { HotelFlag } from '@/components/HotelFlag';
import { Badge, buttonClass, EmptyState, Spinner } from '@/components/ui';
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

function ConsoleHeader({ workspace }: { workspace: Workspace }) {
  const { t } = useTranslation();
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="surface flex flex-col gap-5 rounded-3xl p-4 sm:flex-row sm:items-center sm:p-5"
    >
      <FurniStage
        name="webApi"
        size={64}
        className="size-24 shrink-0 rounded-2xl border border-slate-100"
        furniClassName="animate-float"
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-sky-700/70">
          <HotelFlag hotel={workspace.hotel} className="size-4" />
          {findHotel(workspace.hotel)?.name}
          <span className="text-sky-200">·</span>
          {t('workspaces.room', { id: workspace.roomId })}
        </p>
        <h1 className="mt-1 truncate text-3xl font-bold tracking-tight text-ink">
          {workspace.name}
        </h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {workspace.readKey && (
            <Badge tone="sky">
              <Eye className="size-3" aria-hidden />
              {t('workspaces.readKey')}
            </Badge>
          )}
          {workspace.writeKey && (
            <Badge tone="amber">
              <PencilLine className="size-3" aria-hidden />
              {t('workspaces.writeKey')}
            </Badge>
          )}
        </div>
      </div>
      <Link
        to={`/w/${workspace.id}/settings`}
        className={buttonClass('secondary', 'md', 'self-start sm:self-center')}
      >
        <Settings className="size-4" aria-hidden />
        {t('console.settings')}
      </Link>
    </motion.header>
  );
}

function TabBar({ tab, onChange }: { tab: ConsoleTab; onChange: (tab: ConsoleTab) => void }) {
  const { t } = useTranslation();
  return (
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
            onClick={() => onChange(name)}
            className={clsx(
              'relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors',
              active ? 'text-sky-600' : 'text-sky-900/50 hover:bg-sky-50 hover:text-sky-700',
            )}
          >
            {active && (
              <motion.span
                layoutId="console-tab"
                className="absolute inset-0 rounded-xl bg-sky-100/80"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <Icon className="relative size-4" aria-hidden />
            <span className="relative">{t(`console.tabs.${name}`)}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Console({ workspace }: { workspace: Workspace }) {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const tab = parseTab(params.get('tab'));

  return (
    <ConsoleProvider workspace={workspace}>
      <div className="space-y-5">
        <ConsoleHeader workspace={workspace} />

        {!workspace.readKey ? (
          <div className="surface rounded-3xl">
            <EmptyState
              icon={<WiredFurni name="webApi" size={56} />}
              title={t('console.noReadKey')}
            >
              <Link
                to={`/w/${workspace.id}/settings`}
                className={buttonClass('primary', 'md', 'mt-4')}
              >
                {t('console.settings')}
              </Link>
            </EmptyState>
          </div>
        ) : (
          <>
            {!workspace.writeKey && (
              <p className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                <TriangleAlert className="size-4 shrink-0" aria-hidden />
                {t('console.readOnly')}
              </p>
            )}

            <TabBar tab={tab} onChange={(name) => setParams({ tab: name })} />

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                role="tabpanel"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {tab === 'overview' && <OverviewTab />}
                {tab === 'explorer' && <ExplorerTab key={params.get('variable') ?? ''} />}
                {tab === 'profiles' && <ProfilesTab />}
                {tab === 'tools' && <ToolsTab />}
                {tab === 'activity' && <ActivityTab />}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
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
      <div className="surface mx-auto max-w-xl rounded-3xl">
        <EmptyState
          icon={<WiredFurni name="echo" size={56} />}
          title={workspace.error ? describeError(workspace.error, t) : t('console.notFound')}
        >
          <Link to="/workspaces" className={buttonClass('secondary', 'md', 'mt-4')}>
            {t('nav.workspaces')}
          </Link>
        </EmptyState>
      </div>
    );
  }

  return <Console key={workspace.data.id} workspace={workspace.data} />;
}
