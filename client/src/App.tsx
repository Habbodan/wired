import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Shell } from '@/components/Shell';
import { Spinner } from '@/components/ui';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const WorkspacesPage = lazy(() =>
  import('@/features/workspaces/WorkspacesPage').then((module) => ({
    default: module.WorkspacesPage,
  })),
);
const WorkspaceEditorPage = lazy(() =>
  import('@/features/workspaces/WorkspaceEditorPage').then((module) => ({
    default: module.WorkspaceEditorPage,
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

  if (!failed) return null;
  return (
    <div
      role="alert"
      className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-red-400/30 bg-red-500/20 px-5 py-3 text-sm font-semibold text-red-100 shadow-xl backdrop-blur-md"
    >
      {t('errors.login_failed')}
    </div>
  );
}

const fallback = (
  <div className="flex min-h-[80vh] items-center justify-center">
    <Spinner />
  </div>
);

export function App() {
  return (
    <Shell>
      <LoginNotice />
      <Suspense fallback={fallback}>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="workspaces" element={<WorkspacesPage />} />
          <Route path="workspaces/new" element={<WorkspaceEditorPage />} />
          <Route path="w/:id" element={<ConsolePage />} />
          <Route path="w/:id/settings" element={<WorkspaceEditorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Shell>
  );
}
