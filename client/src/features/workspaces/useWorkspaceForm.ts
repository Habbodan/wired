import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { findHotel, type HotelId } from '@shared/hotels';
import {
  emptyWorkspaceState,
  roomIdSchema,
  wiredKeySchema,
  workspaceMetaSchema,
  type Workspace,
} from '@shared/wired';
import { useSession } from '@/features/auth/session';
import { useSaveWorkspace } from './hooks';
import { remembersKeys, setRememberKeys } from './repository';

export type KeyName = 'readKey' | 'writeKey';
export type FieldName = 'name' | 'roomId' | KeyName;
export type FieldErrors = Partial<Record<FieldName, string>>;

const ALL_FIELDS: FieldName[] = ['name', 'roomId', 'readKey', 'writeKey'];

function defaultHotel(userHotel: string | undefined, language: string): HotelId {
  const fromUser = userHotel ? findHotel(userHotel) : undefined;
  if (fromUser) return fromUser.id;
  return language === 'tr' ? 'tr' : 'com';
}

export function useWorkspaceForm(existing?: Workspace) {
  const { t, i18n } = useTranslation();
  const session = useSession();
  const save = useSaveWorkspace();
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
  const [errors, setErrors] = useState<FieldErrors>({});

  const errorFor = (field: FieldName): string | undefined => {
    switch (field) {
      case 'name':
        return workspaceMetaSchema.shape.name.safeParse(name).success
          ? undefined
          : t('editor.errors.name');
      case 'roomId':
        return roomIdSchema.safeParse(roomId).success ? undefined : t('editor.errors.roomId');
      default:
        return keys[field] && !wiredKeySchema.safeParse(keys[field]).success
          ? t('editor.errors.key')
          : undefined;
    }
  };

  const validate = (fields: FieldName[] = ALL_FIELDS): boolean => {
    const found = Object.fromEntries(
      fields.map((field) => [field, errorFor(field)]).filter(([, error]) => error),
    ) as FieldErrors;
    setErrors((current) => ({
      ...Object.fromEntries(
        Object.entries(current).filter(([field]) => !fields.includes(field as FieldName)),
      ),
      ...found,
    }));
    return Object.keys(found).length === 0;
  };

  const keyValue = (key: KeyName): string | null | undefined => {
    if (keys[key]) return keys[key];
    if (cleared[key] || !existing) return null;
    return undefined;
  };

  const submit = (onSaved: (id: string) => void) => {
    if (!validate()) return;
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
      { onSuccess: () => onSaved(id) },
    );
  };

  return {
    existing,
    isGuest,
    errors,
    saving: save.isPending,
    saveError: save.error,
    values: { name, hotel, roomId, keys, cleared, remember },
    setName,
    setHotel,
    setRoomId: (value: string) => setRoomId(value.replace(/\D/g, '')),
    setKey: (key: KeyName, value: string) =>
      setKeys((current) => ({ ...current, [key]: value.trim() })),
    clearKey: (key: KeyName) => setCleared((current) => ({ ...current, [key]: true })),
    setRemember,
    validate,
    submit,
  };
}

export type WorkspaceForm = ReturnType<typeof useWorkspaceForm>;
