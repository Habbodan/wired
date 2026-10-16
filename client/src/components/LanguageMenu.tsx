import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronsUpDown } from 'lucide-react';
import clsx from 'clsx';
import { changeLanguage, LANGUAGES } from '@/i18n';
import { useDismiss } from '@/hooks/useDismiss';

const flagUrl = (flag: string) => `/flags/${flag}.svg`;

export function LanguageMenu() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const current = LANGUAGES.find((language) => language.code === i18n.language) ?? LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={t('nav.language')}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-700"
      >
        <img src={flagUrl(current.flag)} alt="" className="size-4 rounded-full shadow-sm" />
        <span className="flex-1 truncate text-left">{current.label}</span>
        <ChevronsUpDown className="size-3.5 text-slate-400" aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label={t('nav.language')}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 bottom-full left-0 z-50 mb-2 max-h-80 overflow-y-auto rounded-2xl border border-line bg-white p-1 shadow-[0_12px_40px_rgb(12_74_110/0.15)]"
          >
            {LANGUAGES.map((language) => {
              const selected = language.code === current.code;
              return (
                <li key={language.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      changeLanguage(language.code);
                      close();
                    }}
                    className={clsx(
                      'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors',
                      selected
                        ? 'bg-sky-50 font-semibold text-sky-700'
                        : 'text-slate-600 hover:bg-sky-50/60',
                    )}
                  >
                    <img src={flagUrl(language.flag)} alt="" className="size-4 rounded-full" />
                    <span className="flex-1">{language.label}</span>
                    {selected && <Check className="size-4 text-sky-500" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
