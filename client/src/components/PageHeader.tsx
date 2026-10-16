import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  meta?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ meta, title, description, actions }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="min-w-0">
        {meta && <div className="mb-2 text-sm font-semibold text-sky-700/70">{meta}</div>}
        <h1 className="truncate text-3xl font-bold tracking-tight text-ink md:text-4xl">{title}</h1>
        {description && (
          <div className="mt-2 max-w-2xl text-base text-sky-900/60">{description}</div>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </motion.header>
  );
}
