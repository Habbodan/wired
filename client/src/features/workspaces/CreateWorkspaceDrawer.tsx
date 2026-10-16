import { Fragment, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import clsx from 'clsx';
import { Drawer } from '@/components/Drawer';
import { FurniStage } from '@/components/FurniStage';
import type { FurniName } from '@/components/WiredFurni';
import { Button } from '@/components/ui';
import { describeError } from '@/lib/errors';
import { useWorkspaceForm, type FieldName } from './useWorkspaceForm';
import { HotelPicker, KeyField, KeyStorageNote, NameField, RoomField } from './WorkspaceFields';

const STEPS = [
  { key: 'hotel', furni: 'room', fields: [] },
  { key: 'room', furni: 'furni', fields: ['name', 'roomId'] },
  { key: 'keys', furni: 'webApi', fields: ['readKey', 'writeKey'] },
] as const satisfies readonly { key: string; furni: FurniName; fields: readonly FieldName[] }[];

const slide = {
  enter: (direction: number) => ({ x: direction * 48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -48, opacity: 0 }),
};

function Stepper({ step }: { step: number }) {
  const { t } = useTranslation();
  return (
    <ol className="flex items-center gap-2 px-5 py-4">
      {STEPS.map((item, index) => {
        const done = index < step;
        const active = index === step;
        return (
          <Fragment key={item.key}>
            {index > 0 && (
              <span className="h-0.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <motion.span
                  className="block h-full bg-sky-400"
                  initial={false}
                  animate={{ width: index <= step ? '100%' : '0%' }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </span>
            )}
            <li className="flex items-center gap-2">
              <motion.span
                initial={false}
                animate={{ scale: active ? 1.08 : 1 }}
                className={clsx(
                  'flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  done && 'bg-sky-500 text-white',
                  active && 'bg-sky-100 text-sky-600 ring-2 ring-sky-400',
                  !done && !active && 'bg-slate-100 text-slate-400',
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
              </motion.span>
              <span
                className={clsx(
                  'hidden text-sm font-bold sm:block',
                  active ? 'text-ink' : 'text-slate-400',
                )}
              >
                {t(`wizard.steps.${item.key}`)}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}

function Wizard({ onCreated }: { onCreated: (id: string) => void }) {
  const { t } = useTranslation();
  const form = useWorkspaceForm();
  const [[step, direction], setStep] = useState<[number, number]>([0, 1]);
  const current = STEPS[step] ?? STEPS[0];
  const last = step === STEPS.length - 1;

  const go = (next: number) => setStep([next, next > step ? 1 : -1]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.validate([...current.fields])) return;
    if (last) form.submit(onCreated);
    else go(step + 1);
  };

  return (
    <form onSubmit={submit} className="flex h-full flex-col" noValidate>
      <div className="border-b border-sky-100">
        <Stepper step={step} />
      </div>

      <div className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={current.key}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="space-y-5 p-5"
          >
            <div className="flex items-center gap-4">
              <FurniStage
                name={current.furni}
                size={40}
                className="size-14 shrink-0 rounded-2xl border border-slate-100 shadow-sm"
              />
              <div>
                <p className="text-xs font-bold text-sky-500">
                  {t('wizard.stepOf', { current: step + 1, total: STEPS.length })}
                </p>
                <h3 className="text-xl font-bold text-ink">{t(`wizard.titles.${current.key}`)}</h3>
              </div>
            </div>
            {current.key === 'hotel' && (
              <>
                <HotelPicker form={form} />
                <p className="text-xs text-slate-400">{t('editor.hotelHint')}</p>
              </>
            )}
            {current.key === 'room' && (
              <>
                <NameField form={form} />
                <RoomField form={form} />
              </>
            )}
            {current.key === 'keys' && (
              <>
                <KeyField form={form} name="readKey" />
                <KeyField form={form} name="writeKey" />
                <p className="text-xs text-slate-400">{t('editor.keyHint')}</p>
                <KeyStorageNote form={form} />
              </>
            )}
            {form.saveError && (
              <p className="text-sm text-red-500">{describeError(form.saveError, t)}</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="flex items-center gap-3 border-t border-sky-100 bg-sky-50/50 px-5 py-4">
        <Button
          variant="ghost"
          onClick={() => go(step - 1)}
          className={clsx(step === 0 && 'invisible')}
          icon={<ArrowLeft className="size-4" aria-hidden />}
        >
          {t('common.back')}
        </Button>
        <Button type="submit" loading={form.saving} className="ml-auto">
          {last ? t('editor.create') : t('wizard.next')}
          {!last && <ArrowRight className="size-4" aria-hidden />}
        </Button>
      </footer>
    </form>
  );
}

export function CreateWorkspaceDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('editor.createTitle')}
      closeLabel={t('common.close')}
    >
      <Wizard onCreated={(id) => navigate(`/w/${id}`)} />
    </Drawer>
  );
}
