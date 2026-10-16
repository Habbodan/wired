import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { buttonClass } from '@/components/ui';
import { WiredFurni } from '@/components/WiredFurni';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="flex size-24 items-center justify-center rounded-3xl bg-white shadow-lg ring-1 ring-sky-100"
      >
        <WiredFurni name="echo" size={56} />
      </motion.div>
      <p className="mt-8 text-6xl font-black text-sky-200">404</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{t('notFound.title')}</h1>
      <p className="mt-2 text-slate-500">{t('notFound.body')}</p>
      <Link to="/" className={buttonClass('secondary', 'md', 'mt-8')}>
        {t('notFound.home')}
      </Link>
    </div>
  );
}
