import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { buttonClass } from '@/components/ui';
import { WiredFurni } from '@/components/WiredFurni';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-28 text-center">
      <WiredFurni name="echo" size={72} className="animate-float" />
      <h1 className="mt-6 text-3xl font-black text-white">{t('notFound.title')}</h1>
      <p className="mt-2 text-sky-200/60">{t('notFound.body')}</p>
      <Link to="/" className={buttonClass('secondary', 'md', 'mt-8')}>
        {t('notFound.home')}
      </Link>
    </div>
  );
}
