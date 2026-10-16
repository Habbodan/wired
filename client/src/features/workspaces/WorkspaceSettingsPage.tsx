import type { FormEvent, ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type { Workspace } from '@shared/wired';
import { ConfirmButton } from '@/components/ConfirmButton';
import { PageHeader } from '@/components/PageHeader';
import { Button, buttonClass, EmptyState, Spinner } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { useRemoveWorkspace, useWorkspace } from './hooks';
import { useWorkspaceForm } from './useWorkspaceForm';
import { HotelPicker, KeyField, KeyStorageNote, NameField, RoomField } from './WorkspaceFields';

function SettingsSection({
  title,
  body,
  danger,
  index,
  children,
}: {
  title: string;
  body: string;
  danger?: boolean;
  index: number;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
      className="grid gap-4 lg:grid-cols-[16rem_1fr] lg:gap-8"
    >
      <div>
        <h2 className={danger ? 'text-lg font-bold text-red-500' : 'text-lg font-bold text-ink'}>
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-400">{body}</p>
      </div>
      <div
        className={
          danger
            ? 'space-y-5 rounded-3xl border border-red-200 bg-white p-5 shadow-sm'
            : 'surface space-y-5 rounded-3xl p-5 sm:p-7'
        }
      >
        {children}
      </div>
    </motion.section>
  );
}

function SettingsForm({ workspace }: { workspace: Workspace }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const form = useWorkspaceForm(workspace);
  const remove = useRemoveWorkspace();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    form.submit((id) => navigate(`/w/${id}`));
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-10">
      <SettingsSection
        index={0}
        title={t('settings.general.title')}
        body={t('settings.general.body')}
      >
        <NameField form={form} />
        <RoomField form={form} />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink">{t('editor.hotel')}</p>
          <HotelPicker form={form} />
        </div>
      </SettingsSection>

      <SettingsSection index={1} title={t('settings.keys.title')} body={t('settings.keys.body')}>
        <div className="grid gap-5 sm:grid-cols-2">
          <KeyField form={form} name="readKey" />
          <KeyField form={form} name="writeKey" />
        </div>
        <KeyStorageNote form={form} />
      </SettingsSection>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="glass sticky bottom-4 z-10 flex items-center gap-3 rounded-2xl p-3 pl-5"
      >
        {form.saveError ? (
          <p className="text-sm text-red-500">{describeError(form.saveError, t)}</p>
        ) : (
          <p className="hidden text-sm text-slate-400 sm:block">{workspace.name}</p>
        )}
        <Link to={`/w/${workspace.id}`} className={buttonClass('ghost', 'md', 'ml-auto')}>
          {t('common.cancel')}
        </Link>
        <Button type="submit" loading={form.saving}>
          {t('editor.saveChanges')}
        </Button>
      </motion.div>

      <SettingsSection
        index={2}
        danger
        title={t('settings.danger.title')}
        body={t('settings.danger.body')}
      >
        <ConfirmButton
          question={t('editor.deleteConfirm')}
          confirmLabel={t('common.delete')}
          loading={remove.isPending}
          icon={<Trash2 className="size-4" aria-hidden />}
          onConfirm={() =>
            remove.mutate(workspace.id, { onSuccess: () => navigate('/workspaces') })
          }
        >
          {t('editor.delete')}
        </ConfirmButton>
      </SettingsSection>
    </form>
  );
}

export function WorkspaceSettingsPage() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const workspace = useWorkspace(id, Boolean(id));

  return (
    <div className="space-y-8">
      <PageHeader
        meta={workspace.data?.name}
        title={t('editor.editTitle')}
        actions={
          <Link to={`/w/${id}`} className={buttonClass('secondary', 'sm')}>
            <ArrowLeft className="size-4" aria-hidden />
            {t('common.back')}
          </Link>
        }
      />
      {workspace.isPending ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : workspace.data ? (
        <SettingsForm workspace={workspace.data} />
      ) : (
        <div className="surface">
          <EmptyState
            title={workspace.error ? describeError(workspace.error, t) : t('console.notFound')}
          />
        </div>
      )}
    </div>
  );
}
