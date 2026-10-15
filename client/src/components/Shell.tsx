import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { BookOpen, ExternalLink, LayoutGrid, Mail } from 'lucide-react';
import { FloatingNav } from './FloatingNav';
import { GithubMark } from './GithubMark';
import { API_DOCS_URL, HABBODAN_LOGO, HABBODAN_URL, REPOSITORY_URL } from './links';

const linkClass =
  'flex items-center gap-2 text-sky-100/60 transition-all hover:pl-1 hover:text-sky-300';

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="relative overflow-hidden border-t border-sky-900/50 bg-night-950 pt-16 pb-36">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500/30 via-indigo-400/30 to-sky-500/30" />
      <div className="pointer-events-none absolute top-0 left-1/4 size-96 -translate-y-1/2 rounded-full bg-sky-500/5 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-8">
          <div className="space-y-4 md:col-span-2">
            <a href={HABBODAN_URL} className="inline-block transition-opacity hover:opacity-80">
              <img src={HABBODAN_LOGO} alt="Habbodan" className="h-10 w-auto object-contain" />
            </a>
            <p className="max-w-sm text-sm leading-relaxed text-sky-100/50">
              {t('footer.description')}
            </p>
            <div className="flex gap-3 pt-2">
              <a
                href={REPOSITORY_URL}
                target="_blank"
                rel="noreferrer"
                aria-label={t('nav.source')}
                className="rounded-lg bg-white/10 p-2 text-white shadow-sm transition-all hover:scale-110 hover:bg-white/15"
              >
                <GithubMark className="size-[18px]" />
              </a>
              <a
                href="mailto:info@habbodan.com"
                aria-label="E-mail"
                className="rounded-lg bg-sky-500/10 p-2 text-sky-300 transition-all hover:scale-110 hover:bg-sky-500/20"
              >
                <Mail className="size-[18px]" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-white">{t('footer.explore')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/workspaces" className={linkClass}>
                  <LayoutGrid className="size-3.5" /> {t('nav.workspaces')}
                </Link>
              </li>
              <li>
                <a href={API_DOCS_URL} target="_blank" rel="noreferrer" className={linkClass}>
                  <BookOpen className="size-3.5" /> {t('nav.docs')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-white">{t('footer.project')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={REPOSITORY_URL} target="_blank" rel="noreferrer" className={linkClass}>
                  <GithubMark className="size-3.5" /> {t('footer.openSource')}
                </a>
              </li>
              <li>
                <a href={HABBODAN_URL} className={linkClass}>
                  <ExternalLink className="size-3.5" /> Habbodan.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="my-8 h-px bg-white/[0.06]" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-sky-100/40 md:flex-row">
          <p>© {new Date().getFullYear()} Habbodan</p>
          <p className="max-w-md text-center md:text-right">{t('footer.disclaimer')}</p>
        </div>
      </div>
    </footer>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingNav />
    </div>
  );
}
