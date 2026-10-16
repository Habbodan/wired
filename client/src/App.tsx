import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { AppShell } from '@/components/AppShell';
import { Spinner } from '@/components/ui';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const WorkspacesPage = lazy(() =>
  import('@/features/workspaces/WorkspacesPage').then((module) => ({
    default: module.WorkspacesPage,
  })),
);
const WorkspaceSettingsPage = lazy(() =>
  import('@/features/workspaces/WorkspaceSettingsPage').then((module) => ({
    default: module.WorkspaceSettingsPage,
  })),
);
const ConsolePage = lazy(() =>
  import('@/features/console/ConsolePage').then((module) => ({ default: module.ConsolePage })),
);

function LoginNotice() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const failed = params.get('login') === 'failed';

  useEffect(() => {
    if (!failed) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params);
      next.delete('login');
      setParams(next, { replace: true });
    }, 6000);
    return () => clearTimeout(timer);
  }, [failed, params, setParams]);

  return (
    <AnimatePresence>
      {failed && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-red-200 bg-white/95 px-5 py-3 text-sm font-medium text-red-500 shadow-xl backdrop-blur-md"
        >
          {t('errors.login_failed')}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const fallback = (
  <div className="flex min-h-[60vh] items-center justify-center">
    <Spinner />
  </div>
);

export function App() {
  return (
    <AppShell>
      <LoginNotice />
      <Suspense fallback={fallback}>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="workspaces" element={<WorkspacesPage />} />
          <Route path="workspaces/new" element={<WorkspacesPage />} />
          <Route path="w/:id" element={<ConsolePage />} />
          <Route path="w/:id/settings" element={<WorkspaceSettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
