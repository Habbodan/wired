import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, EyeOff, Lock, Trash2 } from 'lucide-react';
import { findHotel, HOTELS, type HotelId } from '@shared/hotels';
import {
  emptyWorkspaceState,
  roomIdSchema,
  wiredKeySchema,
  workspaceMetaSchema,
  type Workspace,
} from '@shared/wired';
import { ConfirmButton } from '@/components/ConfirmButton';
import { Section } from '@/components/Section';
import { Button, buttonClass, EmptyState, Field, Input, Segmented, Spinner } from '@/components/ui';
import { useSession } from '@/features/auth/session';
import { describeError } from '@/lib/errors';
import { useRemoveWorkspace, useSaveWorkspace, useWorkspace } from './hooks';
import { remembersKeys, setRememberKeys } from './repository';

type KeyName = 'readKey' | 'writeKey';

const HOTEL_OPTIONS = HOTELS.map((hotel) => ({ value: hotel.id, label: hotel.id.toUpperCase() }));
type Errors = Partial<Record<'name' | 'roomId' | KeyName, string>>;

function KeyInput({
  id,
  describedBy,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  describedBy: string | undefined;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        aria-describedby={describedBy}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value.trim())}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="pr-11 font-mono"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-sky-200/50 hover:text-white"
        aria-label={visible ? t('common.hide') : t('common.show')}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function defaultHotel(userHotel: string | undefined, language: string): HotelId {
  const fromUser = userHotel ? findHotel(userHotel) : undefined;
  if (fromUser) return fromUser.id;
  return language === 'tr' ? 'tr' : 'com';
}

function WorkspaceForm({ existing }: { existing?: Workspace }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const session = useSession();
  const save = useSaveWorkspace();
  const remove = useRemoveWorkspace();
  const isGuest = !session.data;

  const [name, setName] = useState(existing?.name ?? '');
  const [hotel, setHotel] = useState<HotelId>(
    existing?.hotel ?? defaultHotel(session.data?.hotel, i18n.language),
  );
  const [roomId, setRoomId] = useState(existing ? String(existing.roomId) : '');
  const [keys, setKeys] = useState<Record<KeyName, string>>({ readKey: '', writeKey: '' });
  const [cleared, setCleared] = useState<Record<KeyName, boolean>>({
    readKey: false,
    writeKey: false,
  });
  const [remember, setRemember] = useState(remembersKeys);
  const [errors, setErrors] = useState<Errors>({});

  function validate(): Errors {
    const next: Errors = {};
    if (!workspaceMetaSchema.shape.name.safeParse(name).success)
      next.name = t('editor.errors.name');
    if (!roomIdSchema.safeParse(roomId).success) next.roomId = t('editor.errors.roomId');
    for (const key of ['readKey', 'writeKey'] as const) {
      if (keys[key] && !wiredKeySchema.safeParse(keys[key]).success)
        next[key] = t('editor.errors.key');
    }
    return next;
  }

  function keyValue(key: KeyName): string | null | undefined {
    if (keys[key]) return keys[key];
    if (cleared[key] || !existing) return null;
    return undefined;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (isGuest && remember !== remembersKeys()) setRememberKeys(remember);

    const id = existing?.id ?? crypto.randomUUID();
    save.mutate(
      {
        id,
        input: {
          name: name.trim(),
          hotel,
          roomId: Number(roomId),
          readKey: keyValue('readKey'),
          writeKey: keyValue('writeKey'),
          state: existing?.state ?? emptyWorkspaceState(),
        },
      },
      { onSuccess: () => navigate(`/w/${id}`) },
    );
  }

  const keyField = (key: KeyName, label: string) => {
    const saved = Boolean(existing?.[key]) && !cleared[key];
    return (
      <Field label={label} error={errors[key]} hint={saved ? t('editor.keepKey') : undefined}>
        {(id, describedBy) => (
          <>
            <KeyInput
              id={id}
              describedBy={describedBy}
              value={keys[key]}
              onChange={(value) => setKeys((current) => ({ ...current, [key]: value }))}
              placeholder={saved ? '••••••••••••••••' : undefined}
            />
            {saved && (
              <button
                type="button"
                onClick={() => setCleared((current) => ({ ...current, [key]: true }))}
                className="self-start text-xs font-semibold text-red-300 hover:text-red-200"
              >
                {t('editor.clearKey')}
              </button>
            )}
          </>
        )}
      </Field>
    );
  };

  return (
    <form
      onSubmit={submit}
      className="card mx-auto flex max-w-2xl flex-col gap-6 p-6 sm:p-8"
      noValidate
    >
      <Field label={t('editor.name')} error={errors.name}>
        {(id, describedBy) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('editor.namePlaceholder')}
            maxLength={48}
            autoFocus={!existing}
          />
        )}
      </Field>

      <div className="flex flex-col gap-2">
        <span className="field-label ml-1">{t('editor.hotel')}</span>
        <Segmented
          label={t('editor.hotel')}
          value={hotel}
          options={HOTEL_OPTIONS}
          onChange={setHotel}
        />
        <p className="ml-1 text-xs text-sky-200/50">{t('editor.hotelHint')}</p>
      </div>

      <div className="grid gap-5">
        <Field label={t('editor.roomId')} hint={t('editor.roomIdHint')} error={errors.roomId}>
          {(id, describedBy) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              value={roomId}
              onChange={(event) => setRoomId(event.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              placeholder="12345678"
            />
          )}
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {keyField('readKey', t('editor.readKey'))}
        {keyField('writeKey', t('editor.writeKey'))}
      </div>
      <p className="-mt-3 ml-1 text-xs text-sky-200/50">{t('editor.keyHint')}</p>

      {isGuest ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="mt-0.5 size-4 accent-sky-500"
          />
          <span>
            <span className="block text-sm font-bold text-white">{t('editor.remember')}</span>
            <span className="block text-xs text-sky-200/50">{t('editor.rememberHint')}</span>
          </span>
        </label>
      ) : (
        <p className="ml-1 flex items-center gap-2 text-xs font-medium text-emerald-300/90">
          <Lock className="size-3.5" aria-hidden />
          {t('editor.encrypted')}
        </p>
      )}

      {save.error && (
        <p className="text-sm font-semibold text-red-300">{describeError(save.error, t)}</p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center">
        {existing && (
          <ConfirmButton
            question={t('editor.deleteConfirm')}
            confirmLabel={t('common.delete')}
            loading={remove.isPending}
            icon={<Trash2 className="size-4" aria-hidden />}
            onConfirm={() =>
              remove.mutate(existing.id, { onSuccess: () => navigate('/workspaces') })
            }
          >
            {t('editor.delete')}
          </ConfirmButton>
        )}
        <Button type="submit" size="lg" loading={save.isPending} className="sm:ml-auto">
          {existing ? t('editor.saveChanges') : t('editor.create')}
        </Button>
      </div>
    </form>
  );
}

export function WorkspaceEditorPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const workspace = useWorkspace(id ?? '', Boolean(id));
  const backTo = id ? `/w/${id}` : '/workspaces';

  return (
    <Section
      title={id ? t('editor.editTitle') : t('editor.createTitle')}
      action={
        <Link to={backTo} className={buttonClass('secondary', 'sm')}>
          <ArrowLeft className="size-4" />
          {t('common.back')}
        </Link>
      }
    >
      {!id ? (
        <WorkspaceForm />
      ) : workspace.isPending ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : workspace.data ? (
        <WorkspaceForm existing={workspace.data} />
      ) : (
        <div className="card mx-auto max-w-2xl">
          <EmptyState
            title={workspace.error ? describeError(workspace.error, t) : t('console.notFound')}
          />
        </div>
      )}
    </Section>
  );
}
