import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { FurniStage } from '@/components/FurniStage';
import { RoomScene } from '@/components/RoomScene';
import type { FurniName } from '@/components/WiredFurni';
import { useWorkspaceList } from '@/features/workspaces/hooks';
import { WorkspaceCard } from '@/features/workspaces/WorkspaceCard';

const STEPS: { key: 'one' | 'two' | 'three'; furni: FurniName }[] = [
  { key: 'one', furni: 'webApi' },
  { key: 'two', furni: 'room' },
  { key: 'three', furni: 'changed' },
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const rise = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
} as const;

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-400 via-sky-300 to-sky-200 p-6 shadow-[0_20px_60px_-20px_rgb(14_165_233/0.6)] sm:p-10">
      <div className="pointer-events-none absolute -top-10 left-1/3 h-32 w-80 animate-float rounded-full bg-white/50 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-40 w-96 animate-float rounded-full bg-white/40 blur-3xl [animation-delay:-3s]" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="min-w-0">
          <motion.h1
            variants={rise}
            lang="en"
            className="bg-gradient-to-br from-white to-sky-100 bg-clip-text text-4xl leading-none font-black tracking-tight text-transparent uppercase drop-shadow-sm min-[400px]:text-5xl sm:text-6xl"
          >
            Wired<span className="text-sky-700">Portal</span>
          </motion.h1>
          <motion.p
            variants={rise}
            className="mt-4 max-w-lg text-lg leading-relaxed font-medium text-sky-900/80"
          >
            {t('home.subtitle')}
          </motion.p>
          <motion.div variants={rise} className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/workspaces/new"
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-6 font-bold text-sky-600 shadow-lg transition-all hover:scale-[1.03] hover:bg-white active:scale-95"
            >
              {t('home.cta')}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="hidden sm:block"
        >
          <RoomScene className="mx-auto w-full max-w-lg animate-float [animation-duration:8s]" />
        </motion.div>
      </div>
    </section>
  );
}

function Recent() {
  const { t } = useTranslation();
  const workspaces = useWorkspaceList();
  const recent = workspaces.data?.slice(0, 3) ?? [];
  if (recent.length === 0) return null;

  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-2xl font-bold text-ink">{t('home.recent')}</h2>
        <Link to="/workspaces" className="text-sm font-bold text-sky-600 hover:text-sky-700">
          {t('home.viewAll')}
        </Link>
      </div>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {recent.map((workspace) => (
          <WorkspaceCard key={workspace.id} workspace={workspace} />
        ))}
      </motion.div>
    </section>
  );
}

function GettingStarted() {
  const { t } = useTranslation();
  return (
    <section className="surface overflow-hidden">
      <div className="p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-ink">{t('home.steps.title')}</h2>
        <motion.ol
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="mt-6 grid gap-6 md:grid-cols-3"
        >
          {STEPS.map(({ key, furni }) => (
            <motion.li key={key} variants={rise} className="flex gap-4">
              <FurniStage
                name={furni}
                size={44}
                className="size-16 shrink-0 rounded-2xl border border-slate-100 shadow-sm"
              />
              <div>
                <h3 className="font-bold text-ink">{t(`home.steps.${key}.title`)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {t(`home.steps.${key}.body`)}
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
      <div className="flex items-start gap-3 border-t border-emerald-100 bg-emerald-50/60 px-6 py-4 sm:px-8">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
        <p className="text-sm text-emerald-900/80">
          <span className="font-bold text-emerald-800">{t('home.security.title')}.</span>{' '}
          {t('home.security.body')}
        </p>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <div className="space-y-12">
      <Hero />
      <Recent />
      <GettingStarted />
    </div>
  );
}
