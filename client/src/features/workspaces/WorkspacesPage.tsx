import { useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CloudUpload, LogIn, Plus, Search } from 'lucide-react';
import { findHotel, type HotelId } from '@shared/hotels';
import type { WorkspaceSummary } from '@shared/wired';
import { FurniStage } from '@/components/FurniStage';
import { HotelFlag } from '@/components/HotelFlag';
import { PageHeader } from '@/components/PageHeader';
import { Button, buttonClass, EmptyState, Input, Segmented, Spinner } from '@/components/ui';
import { loginHref, useSession } from '@/features/auth/session';
import { describeError } from '@/lib/errors';
import { CreateWorkspaceDrawer } from './CreateWorkspaceDrawer';
import { useImportLocalWorkspaces, useLocalWorkspacesForImport, useWorkspaceList } from './hooks';
import { WorkspaceCard } from './WorkspaceCard';

type HotelFilter = HotelId | 'all';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

function Notice({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
        {icon}
      </span>
      {children}
    </motion.div>
  );
}

function ImportNotice() {
  const { t } = useTranslation();
  const local = useLocalWorkspacesForImport();
  const importer = useImportLocalWorkspaces();
  const count = local.data?.length ?? 0;
  if (count === 0) return null;

  return (
    <Notice icon={<CloudUpload className="size-5" />}>
      <p className="text-sm font-medium text-sky-900/80">
        {t('workspaces.import.body', { count })}
      </p>
      <Button
        size="sm"
        className="sm:ml-auto"
        loading={importer.isPending}
        onClick={() => importer.mutate()}
      >
        {t('workspaces.import.action')}
      </Button>
      {importer.error && <p className="text-sm text-red-500">{describeError(importer.error, t)}</p>}
    </Notice>
  );
}

function GuestNotice() {
  const { t } = useTranslation();
  return (
    <Notice icon={<LogIn className="size-5" />}>
      <p className="text-sm font-medium text-sky-900/80">{t('workspaces.guest.body')}</p>
      <a href={loginHref('/workspaces')} className={buttonClass('secondary', 'sm', 'sm:ml-auto')}>
        {t('nav.signIn')}
      </a>
    </Notice>
  );
}

function Toolbar({
  workspaces,
  query,
  onQuery,
  hotel,
  onHotel,
}: {
  workspaces: WorkspaceSummary[];
  query: string;
  onQuery: (value: string) => void;
  hotel: HotelFilter;
  onHotel: (value: HotelFilter) => void;
}) {
  const { t } = useTranslation();
  const hotels = [...new Set(workspaces.map((workspace) => workspace.hotel))];
  const options = [
    { value: 'all' as const, label: t('workspaces.allHotels') },
    ...hotels.map((id) => ({
      value: id,
      label: (
        <>
          <HotelFlag hotel={id} className="size-3.5" />
          {id.toUpperCase()}
        </>
      ),
    })),
  ];

  return (
    <div className="surface flex flex-col gap-3 rounded-3xl p-3 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder={t('workspaces.search')}
          aria-label={t('workspaces.search')}
          className="pl-10"
        />
      </div>
      {hotels.length > 1 && (
        <Segmented label={t('editor.hotel')} value={hotel} options={options} onChange={onHotel} />
      )}
    </div>
  );
}

function NewCard() {
  const { t } = useTranslation();
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
      <Link
        to="/workspaces/new"
        className="group flex h-full min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-sky-200 bg-white/40 text-sky-600 transition-colors hover:border-sky-400 hover:bg-white/70"
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-sky-100 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90">
          <Plus className="size-6" />
        </span>
        <span className="font-bold">{t('workspaces.new')}</span>
      </Link>
    </motion.div>
  );
}

export function WorkspacesPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const session = useSession();
  const workspaces = useWorkspaceList();
  const [query, setQuery] = useState('');
  const [hotel, setHotel] = useState<HotelFilter>('all');

  const all = useMemo(() => workspaces.data ?? [], [workspaces.data]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return all.filter(
      (workspace) =>
        (hotel === 'all' || workspace.hotel === hotel) &&
        [workspace.name, String(workspace.roomId), findHotel(workspace.hotel)?.name ?? '']
          .join(' ')
          .toLowerCase()
          .includes(needle),
    );
  }, [all, query, hotel]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('workspaces.title')}
        description={t('workspaces.subtitle')}
        actions={
          <Link to="/workspaces/new" className={buttonClass('primary')}>
            <Plus className="size-4" aria-hidden />
            {t('workspaces.new')}
          </Link>
        }
      />

      {!session.isPending && !session.data && <GuestNotice />}
      {session.data && <ImportNotice />}

      {workspaces.isPending ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : workspaces.error ? (
        <div className="surface">
          <EmptyState title={describeError(workspaces.error, t)}>
            <Button variant="secondary" size="sm" onClick={() => workspaces.refetch()}>
              {t('common.retry')}
            </Button>
          </EmptyState>
        </div>
      ) : all.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface rounded-3xl"
        >
          <EmptyState
            icon={
              <FurniStage
                name="webApi"
                size={72}
                className="mb-2 size-28 rounded-3xl border border-slate-100 shadow-md"
                furniClassName="animate-float"
              />
            }
            title={t('workspaces.empty.title')}
          >
            <p>{t('workspaces.empty.body')}</p>
            <Link to="/workspaces/new" className={buttonClass('primary', 'md', 'mt-5')}>
              <Plus className="size-4" aria-hidden />
              {t('workspaces.new')}
            </Link>
          </EmptyState>
        </motion.div>
      ) : (
        <>
          {all.length > 3 && (
            <Toolbar
              workspaces={all}
              query={query}
              onQuery={setQuery}
              hotel={hotel}
              onHotel={setHotel}
            />
          )}
          {filtered.length === 0 ? (
            <p className="py-12 text-center font-medium text-sky-900/50">
              {t('workspaces.noResults')}
            </p>
          ) : (
            <motion.div
              key={`${hotel}:${query}`}
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((workspace) => (
                <WorkspaceCard key={workspace.id} workspace={workspace} />
              ))}
              {!query && hotel === 'all' && <NewCard />}
            </motion.div>
          )}
        </>
      )}

      <CreateWorkspaceDrawer
        open={location.pathname === '/workspaces/new'}
        onClose={() => navigate('/workspaces')}
      />
    </div>
  );
}
