import { useCallback, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Check, ChevronUp, Home, LayoutGrid, LogOut, User } from 'lucide-react';
import clsx from 'clsx';
import { findHotel } from '@shared/hotels';
import { changeLanguage, LANGUAGES } from '@/i18n';
import { loginHref, useLogout, useSession } from '@/features/auth/session';
import { useDismiss } from '@/hooks/useDismiss';
import { GithubMark } from './GithubMark';
import { API_DOCS_URL, REPOSITORY_URL } from './links';

const flagUrl = (flag: string) => `/flags/${flag}.svg`;

const popover = {
  initial: { opacity: 0, y: 10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.95 },
  transition: { duration: 0.15 },
};

function Tooltip({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute -top-10 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-sky-400/20 bg-night-800 px-2 py-1 text-[10px] font-bold whitespace-nowrap text-sky-100 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
      {children}
      <span className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border-r border-b border-sky-400/20 bg-night-800" />
    </span>
  );
}

const itemClass = (active: boolean) =>
  clsx(
    'group relative flex min-w-[64px] flex-col items-center gap-1 rounded-xl p-3 transition-all duration-300',
    active ? 'bg-sky-400/15' : 'hover:bg-white/[0.06]',
  );

const iconClass = (active: boolean) =>
  clsx(
    'size-6 transition-colors duration-300',
    active ? 'scale-110 text-sky-300' : 'text-sky-200/60 group-hover:text-sky-300',
  );

function ActiveDot({ active }: { active: boolean }) {
  return (
    <span
      className={clsx(
        'absolute bottom-1 size-1.5 rounded-full transition-all duration-300',
        active
          ? 'scale-100 bg-sky-400 opacity-100'
          : 'scale-75 bg-sky-300 opacity-0 group-hover:opacity-100',
      )}
    />
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  external,
}: {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  external?: boolean;
}) {
  const location = useLocation();
  const active =
    !external && (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to));
  const content = (
    <>
      <Icon className={iconClass(active)} />
      <Tooltip>{label}</Tooltip>
      <ActiveDot active={active} />
      {active && (
        <motion.span
          layoutId="nav-glow"
          className="absolute inset-0 -z-10 rounded-xl bg-sky-400/10"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
    </>
  );

  return external ? (
    <a href={to} target="_blank" rel="noreferrer" className={itemClass(false)} aria-label={label}>
      {content}
    </a>
  ) : (
    <Link
      to={to}
      className={itemClass(active)}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      {content}
    </Link>
  );
}

function LanguageSelector() {
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
        className={clsx(
          'group relative flex min-w-[64px] items-center justify-center gap-2 rounded-xl border p-2 transition-all duration-300',
          open ? 'border-sky-400/20 bg-white/10' : 'border-transparent hover:bg-white/[0.06]',
        )}
      >
        <img
          src={flagUrl(current.flag)}
          alt=""
          className="size-8 rounded-full shadow-md ring-2 ring-white/20"
        />
        <ChevronUp
          className={clsx(
            'size-3 text-sky-400 transition-transform duration-300',
            open && 'rotate-180',
          )}
        />
        <Tooltip>{t('nav.language')}</Tooltip>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            {...popover}
            className="absolute bottom-[calc(100%+12px)] left-0 z-[100] min-w-[200px] overflow-hidden rounded-2xl border border-sky-400/15 bg-night-800 shadow-2xl"
          >
            <div className="max-h-[min(60vh,420px)] space-y-0.5 overflow-y-auto p-1.5">
              {LANGUAGES.map((language) => {
                const selected = language.code === current.code;
                return (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => {
                      changeLanguage(language.code);
                      close();
                    }}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all',
                      selected
                        ? 'bg-sky-400/10 font-bold text-white ring-1 ring-sky-400/20'
                        : 'text-sky-200/70 hover:bg-white/[0.05] hover:text-white',
                    )}
                  >
                    <img
                      src={flagUrl(language.flag)}
                      alt=""
                      className="size-6 shrink-0 rounded-full"
                    />
                    <span className="flex-1">{language.label}</span>
                    {selected && <Check className="size-4 text-sky-400" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function avatarUrl(username: string, hotel: string): string {
  const host = findHotel(hotel)?.host ?? 'www.habbo.com';
  const params = new URLSearchParams({
    user: username,
    direction: '2',
    head_direction: '2',
    headonly: '1',
    size: 'l',
  });
  return `https://${host}/habbo-imaging/avatarimage?${params}`;
}

function AccountButton() {
  const { t } = useTranslation();
  const location = useLocation();
  const session = useSession();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const user = session.data;

  if (!user) {
    return (
      <a
        href={loginHref(location.pathname + location.search)}
        className="group relative flex min-w-[48px] items-center justify-center rounded-xl p-3 transition-colors hover:bg-white/[0.06]"
        aria-label={t('nav.signIn')}
      >
        <User className="size-6 rounded-full bg-sky-400/15 p-0.5 text-sky-300" />
        <Tooltip>{t('nav.signIn')}</Tooltip>
      </a>
    );
  }

  const avatar = imageFailed ? (
    <span className="text-lg font-bold text-sky-200">{user.username.charAt(0).toUpperCase()}</span>
  ) : (
    <img
      src={avatarUrl(user.username, user.hotel)}
      alt=""
      className="-translate-y-1 scale-125 object-contain"
      onError={() => setImageFailed(true)}
    />
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={t('nav.signedInAs', { name: user.username })}
        className="relative flex min-w-[48px] items-center justify-center rounded-xl p-3 transition-colors hover:bg-white/[0.06]"
      >
        <span className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-sky-400/15 shadow-sm ring-2 ring-white/20">
          {avatar}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            {...popover}
            className="absolute right-0 bottom-full mb-4 min-w-[200px] overflow-hidden rounded-2xl border border-sky-400/15 bg-night-800 shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.03] p-3">
              <span className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-sky-400/15 ring-2 ring-white/10">
                {avatar}
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-bold text-white">{user.username}</span>
                <span className="text-xs text-sky-300/80">{findHotel(user.hotel)?.name}</span>
              </span>
            </div>
            <div className="p-1">
              <Link
                to="/workspaces"
                onClick={close}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-sky-100/80 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                <LayoutGrid className="size-4" />
                {t('nav.workspaces')}
              </Link>
              <div className="mx-2 my-1 h-px bg-white/[0.06]" />
              <button
                type="button"
                onClick={() => {
                  close();
                  logout.mutate();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                <LogOut className="size-4" />
                {t('nav.signOut')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FloatingNav() {
  const { t } = useTranslation();

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 md:bottom-8">
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-white/10 bg-night-900/75 px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md"
      >
        <LanguageSelector />
        <div className="mx-1 hidden h-8 w-px bg-white/10 sm:block" />
        <NavItem to="/" label={t('nav.home')} icon={Home} />
        <NavItem to="/workspaces" label={t('nav.workspaces')} icon={LayoutGrid} />
        <NavItem to={API_DOCS_URL} label={t('nav.docs')} icon={BookOpen} external />
        <span className="hidden sm:contents">
          <NavItem to={REPOSITORY_URL} label={t('nav.source')} icon={GithubMark} external />
        </span>
        <div className="mx-1 h-8 w-px bg-white/10" />
        <AccountButton />
      </motion.nav>
    </div>
  );
}
