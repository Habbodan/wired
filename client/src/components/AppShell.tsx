import { useState, type ComponentType, type MouseEvent, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Boxes, Home, Menu } from 'lucide-react';
import clsx from 'clsx';
import { useWorkspaceList } from '@/features/workspaces/hooks';
import { AccountPanel } from './AccountPanel';
import { Drawer } from './Drawer';
import { GithubMark } from './GithubMark';
import { HotelFlag } from './HotelFlag';
import { LanguageMenu } from './LanguageMenu';
import { HABBODAN_LOGO, HABBODAN_URL, REPOSITORY_URL } from './links';
import { WiredFurni } from './WiredFurni';

const RECENT_LIMIT = 5;

function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="Habbodan Wired Portal">
      <WiredFurni
        name="webApi"
        size={compact ? 34 : 40}
        className="transition-transform duration-300 group-hover:-translate-y-0.5"
      />
      <span className="flex flex-col items-start">
        <img
          src={HABBODAN_LOGO}
          alt=""
          width={259}
          height={90}
          draggable={false}
          className={clsx('w-auto', compact ? 'h-7' : 'h-9')}
        />
        <span
          lang="en"
          className={clsx(
            'font-black tracking-wide text-ink uppercase',
            compact ? 'text-[10px]' : 'ml-0.5 text-xs',
          )}
        >
          Wired <span className="text-sky-500">Portal</span>
        </span>
      </span>
    </Link>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
          isActive ? 'text-sky-600' : 'text-sky-900/60 hover:bg-sky-50 hover:text-sky-700',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-xl bg-sky-100/80"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <Icon className="relative size-5" />
          <span className="relative">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function RecentWorkspaces() {
  const { t } = useTranslation();
  const workspaces = useWorkspaceList();
  const recent = workspaces.data?.slice(0, RECENT_LIMIT) ?? [];
  if (recent.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="px-3 pb-2 text-xs font-bold text-sky-900/40">{t('nav.recent')}</p>
      <ul className="space-y-0.5">
        {recent.map((workspace) => (
          <li key={workspace.id}>
            <NavLink
              to={`/w/${workspace.id}`}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-white font-semibold text-sky-700 shadow-sm'
                    : 'text-slate-500 hover:bg-sky-50 hover:text-sky-700',
                )
              }
            >
              <HotelFlag hotel={workspace.hotel} className="size-4" />
              <span className="truncate">{workspace.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SidebarContent() {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-1 pt-1">
        <Brand />
      </div>
      <nav className="flex-1 overflow-y-auto">
        <div className="space-y-1">
          <NavItem to="/" end label={t('nav.home')} icon={Home} />
          <NavItem to="/workspaces" label={t('nav.workspaces')} icon={Boxes} />
        </div>
        <RecentWorkspaces />
      </nav>
      <div className="space-y-1 border-t border-sky-100 pt-4">
        <LanguageMenu />
        <a
          href={REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-700"
        >
          <GithubMark className="size-4" />
          {t('nav.source')}
        </a>
        <div className="pt-2">
          <AccountPanel />
        </div>
      </div>
    </div>
  );
}

function MobileBar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const closeOnLink = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('a')) setOpen(false);
  };

  return (
    <div className="glass sticky top-3 z-40 mx-3 mt-3 flex h-16 items-center justify-between rounded-2xl px-3 lg:hidden">
      <Brand compact />
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('nav.menu')}
        className="rounded-xl p-2.5 text-sky-700 transition-colors hover:bg-sky-50"
      >
        <Menu className="size-5" />
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        side="left"
        title={t('nav.menu')}
        closeLabel={t('common.close')}
      >
        <div className="h-full" onClickCapture={closeOnLink}>
          <SidebarContent />
        </div>
      </Drawer>
    </div>
  );
}

function Sky() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[28rem]">
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300/70 via-sky-200/40 to-transparent" />
      <div className="absolute top-16 left-[18%] h-24 w-72 animate-float rounded-full bg-white/70 blur-3xl" />
      <div className="absolute top-8 right-[12%] h-28 w-96 animate-float rounded-full bg-white/60 blur-3xl [animation-delay:-3s]" />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <div className="relative isolate flex min-h-screen">
      <Sky />
      <aside className="glass sticky top-4 m-4 mr-0 hidden h-[calc(100vh-2rem)] w-64 shrink-0 rounded-3xl lg:block">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBar />
        <motion.main
          key={location.pathname.replace(/\/new$/, '')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 lg:py-12"
        >
          {children}
        </motion.main>
        <footer className="mx-auto w-full max-w-6xl px-4 pb-8 text-xs text-slate-400 sm:px-8">
          © {new Date().getFullYear()}{' '}
          <a href={HABBODAN_URL} className="font-semibold text-sky-600 hover:underline">
            Habbodan
          </a>{' '}
          · {t('footer.disclaimer')}
        </footer>
      </div>
    </div>
  );
}
