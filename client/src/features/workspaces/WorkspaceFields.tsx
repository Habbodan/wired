import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check, Eye, EyeOff, Lock } from 'lucide-react';
import clsx from 'clsx';
import { HOTELS } from '@shared/hotels';
import { HotelFlag } from '@/components/HotelFlag';
import { Field, Input } from '@/components/ui';
import type { KeyName, WorkspaceForm } from './useWorkspaceForm';

export function HotelPicker({ form }: { form: WorkspaceForm }) {
  const { t } = useTranslation();
  return (
    <div
      role="radiogroup"
      aria-label={t('editor.hotel')}
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
    >
      {HOTELS.map((hotel, index) => {
        const selected = form.values.hotel === hotel.id;
        return (
          <motion.button
            key={hotel.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => form.setHotel(hotel.id)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.025 }}
            whileTap={{ scale: 0.97 }}
            className={clsx(
              'relative flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
              selected
                ? 'border-sky-300 bg-sky-50 font-semibold text-sky-700 shadow-sm'
                : 'border-line bg-white text-slate-500 hover:border-sky-200 hover:text-sky-700',
            )}
          >
            <HotelFlag hotel={hotel.id} className="size-5" />
            <span className="truncate font-medium">{hotel.name}</span>
            {selected && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-sky-500 text-white ring-2 ring-white"
              >
                <Check className="size-2.5" strokeWidth={3} />
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

export function NameField({ form }: { form: WorkspaceForm }) {
  const { t } = useTranslation();
  return (
    <Field label={t('editor.name')} error={form.errors.name}>
      {(id, describedBy) => (
        <Input
          id={id}
          aria-describedby={describedBy}
          value={form.values.name}
          onChange={(event) => form.setName(event.target.value)}
          placeholder={t('editor.namePlaceholder')}
          maxLength={48}
        />
      )}
    </Field>
  );
}

export function RoomField({ form }: { form: WorkspaceForm }) {
  const { t } = useTranslation();
  return (
    <Field label={t('editor.roomId')} hint={t('editor.roomIdHint')} error={form.errors.roomId}>
      {(id, describedBy) => (
        <Input
          id={id}
          aria-describedby={describedBy}
          value={form.values.roomId}
          onChange={(event) => form.setRoomId(event.target.value)}
          inputMode="numeric"
          placeholder="12345678"
          className="font-mono"
        />
      )}
    </Field>
  );
}

export function KeyField({ form, name }: { form: WorkspaceForm; name: KeyName }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const saved = Boolean(form.existing?.[name]) && !form.values.cleared[name];

  return (
    <Field
      label={t(name === 'readKey' ? 'editor.readKey' : 'editor.writeKey')}
      error={form.errors[name]}
      hint={saved ? t('editor.keepKey') : undefined}
    >
      {(id, describedBy) => (
        <>
          <div className="relative">
            <Input
              id={id}
              aria-describedby={describedBy}
              type={visible ? 'text' : 'password'}
              value={form.values.keys[name]}
              onChange={(event) => form.setKey(name, event.target.value)}
              placeholder={saved ? '••••••••••••••••' : undefined}
              autoComplete="off"
              spellCheck={false}
              className="pr-11 font-mono"
            />
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 transition-colors hover:text-slate-700"
              aria-label={visible ? t('common.hide') : t('common.show')}
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {saved && (
            <button
              type="button"
              onClick={() => form.clearKey(name)}
              className="self-start text-xs font-medium text-red-500/80 transition-colors hover:text-red-500"
            >
              {t('editor.clearKey')}
            </button>
          )}
        </>
      )}
    </Field>
  );
}

export function KeyStorageNote({ form }: { form: WorkspaceForm }) {
  const { t } = useTranslation();

  if (!form.isGuest) {
    return (
      <p className="flex items-center gap-2 text-xs text-emerald-600">
        <Lock className="size-3.5" aria-hidden />
        {t('editor.encrypted')}
      </p>
    );
  }

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-field p-3.5 transition-colors hover:border-line-strong">
      <input
        type="checkbox"
        checked={form.values.remember}
        onChange={(event) => form.setRemember(event.target.checked)}
        className="mt-0.5 size-4 accent-sky-500"
      />
      <span>
        <span className="block text-sm font-medium text-ink">{t('editor.remember')}</span>
        <span className="block text-xs text-slate-400">{t('editor.rememberHint')}</span>
      </span>
    </label>
  );
}
