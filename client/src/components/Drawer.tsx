import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  closeLabel: string;
  side?: 'left' | 'right';
  className?: string;
  children: ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  closeLabel,
  side = 'right',
  className,
  children,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const offset = side === 'right' ? '100%' : '-100%';

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-sky-950/25 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            initial={{ x: offset }}
            animate={{ x: 0 }}
            exit={{ x: offset }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            className={clsx(
              'absolute inset-y-0 flex w-full flex-col bg-white shadow-[0_0_60px_rgb(12_74_110/0.2)]',
              side === 'right'
                ? 'right-0 sm:max-w-lg sm:rounded-l-3xl'
                : 'left-0 max-w-xs rounded-r-3xl',
              className,
            )}
          >
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-sky-100 px-5">
              <div className="min-w-0 text-lg font-bold text-ink">{title}</div>
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-700"
              >
                <X className="size-5" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
