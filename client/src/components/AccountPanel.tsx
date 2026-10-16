import { useState } from 'react';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LogIn, LogOut } from 'lucide-react';
import { findHotel } from '@shared/hotels';
import { loginHref, useLogout, useSession } from '@/features/auth/session';
import { avatarUrl } from '@/lib/habbo';
import { buttonClass } from './ui';

export function AccountPanel() {
  const { t } = useTranslation();
  const location = useLocation();
  const session = useSession();
  const logout = useLogout();
  const [avatarFailed, setAvatarFailed] = useState(false);

  if (session.isPending) {
    return <div className="h-14 animate-pulse rounded-2xl bg-sky-100/70" />;
  }

  const user = session.data;
  if (!user) {
    return (
      <a
        href={loginHref(location.pathname + location.search)}
        className={buttonClass('primary', 'md', 'w-full')}
      >
        <LogIn className="size-4" aria-hidden />
        {t('nav.signIn')}
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/80 p-2 shadow-sm">
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-100">
        {avatarFailed ? (
          <span className="text-sm font-bold text-sky-700">
            {user.username.charAt(0).toUpperCase()}
          </span>
        ) : (
          <img
            src={avatarUrl(user.username, user.hotel)}
            alt=""
            className="pixelated -mb-2 h-12 w-auto max-w-none"
            onError={() => setAvatarFailed(true)}
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-ink">{user.username}</span>
        <span className="block truncate text-xs text-slate-400">{findHotel(user.hotel)?.name}</span>
      </span>
      <button
        type="button"
        onClick={() => logout.mutate()}
        aria-label={t('nav.signOut')}
        title={t('nav.signOut')}
        className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
