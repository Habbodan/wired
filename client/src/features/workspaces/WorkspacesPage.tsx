import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CloudUpload, LogIn, Plus } from 'lucide-react';
import { findHotel } from '@shared/hotels';
import type { WorkspaceSummary } from '@shared/wired';
import { FURNI_BACKGROUND } from '@/components/links';
import { Section } from '@/components/Section';
import { Button, buttonClass, EmptyState, Pill, Spinner } from '@/components/ui';
import { WiredFurni } from '@/components/WiredFurni';
import { loginHref, useSession } from '@/features/auth/session';
import { describeError } from '@/lib/errors';
import { useImportLocalWorkspaces, useLocalWorkspacesForImport, useWorkspaceList } from './hooks';

function WorkspaceCard({ workspace }: { workspace: WorkspaceSummary }) {
  const { t, i18n } = useTranslation();
  const updated = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
    new Date(workspace.updatedAt),
  );

  return (
    <Link to={`/w/${workspace.id}`} className="block">
      <motion.div
        whileHover={{ y: -5 }}
        className="group relative h-56 overflow-hidden rounded-3xl border border-sky-400/10 bg-night-900 shadow-lg transition-shadow duration-300 hover:shadow-xl hover:shadow-sky-500/10"
      >
        <img
          src={FURNI_BACKGROUND}
          alt=""
          className="absolute inset-0 size-full object-cover opacity-20"
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-night-900 via-night-900/90 to-transparent" />

        <div className="absolute top-4 left-4 z-20 rounded-xl border border-white/10 bg-night-900/80 px-2.5 py-1 text-xs font-bold text-sky-200 backdrop-blur-sm">
          {findHotel(workspace.hotel)?.name}
        </div>
        <div className="absolute top-4 right-4 z-20 flex gap-1.5">
          {workspace.hasReadKey && <Pill tone="sky">{t('workspaces.readKey')}</Pill>}
          {workspace.hasWriteKey && <Pill tone="orange">{t('workspaces.writeKey')}</Pill>}
        </div>

        <div className="absolute inset-0 z-10 flex items-center justify-center pb-16">
          <WiredFurni
            name="webApi"
            size={64}
            className="drop-shadow-xl transition-transform duration-500 group-hover:scale-110"
          />
        </div>

        <div className="absolute bottom-0 z-20 w-full px-5 pb-5 text-center">
          <h2 className="truncate text-lg font-bold text-white">{workspace.name}</h2>
          <p className="mt-1 text-xs font-medium text-sky-200/60">
            {t('workspaces.room', { id: workspace.roomId })} ·{' '}
            {t('workspaces.updated', { date: updated })}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}

function ImportBanner() {
  const { t } = useTranslation();
  const local = useLocalWorkspacesForImport();
  const importer = useImportLocalWorkspaces();
  const count = local.data?.length ?? 0;

  if (count === 0) return null;

  return (
    <div className="glass mb-6 flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-center">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300">
        <CloudUpload className="size-5" />
      </span>
      <p className="text-sm font-medium text-sky-100">{t('workspaces.import.body', { count })}</p>
      <Button
        size="sm"
        className="sm:ml-auto"
        loading={importer.isPending}
        onClick={() => importer.mutate()}
      >
        {t('workspaces.import.action')}
      </Button>
      {importer.error && <p className="text-sm text-red-300">{describeError(importer.error, t)}</p>}
    </div>
  );
}

function GuestNotice() {
  const { t } = useTranslation();
  return (
    <div className="glass mb-6 flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-center">
      <p className="text-sm font-medium text-sky-100/80">{t('workspaces.guest.body')}</p>
      <a href={loginHref('/workspaces')} className={buttonClass('secondary', 'sm', 'sm:ml-auto')}>
        <LogIn className="size-4" />
        {t('nav.signIn')}
      </a>
    </div>
  );
}

export function WorkspacesPage() {
  const { t } = useTranslation();
  const session = useSession();
  const workspaces = useWorkspaceList();

  return (
    <Section
      title={t('workspaces.title')}
      subtitle={t('workspaces.subtitle')}
      action={
        <Link to="/workspaces/new" className={buttonClass('primary', 'lg')}>
          <Plus className="size-5" />
          {t('workspaces.new')}
        </Link>
      }
    >
      {!session.isPending && !session.data && <GuestNotice />}
      {session.data && <ImportBanner />}

      {workspaces.isPending ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : workspaces.error ? (
        <div className="card">
          <EmptyState title={describeError(workspaces.error, t)}>
            <Button variant="secondary" size="sm" onClick={() => workspaces.refetch()}>
              {t('common.retry')}
            </Button>
          </EmptyState>
        </div>
      ) : workspaces.data.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<WiredFurni name="webApi" size={72} className="animate-float" />}
            title={t('workspaces.empty.title')}
          >
            {t('workspaces.empty.body')}
          </EmptyState>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.data.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      )}
    </Section>
  );
}
