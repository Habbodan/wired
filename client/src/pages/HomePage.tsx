import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { NightSky } from '@/components/NightSky';
import { WiredFurni } from '@/components/WiredFurni';
import { API_DOCS_URL, FURNI_BACKGROUND, HABBODAN_LOGO, REPOSITORY_URL } from '@/components/links';

const STEPS = [
  { key: 'one', furni: 'webApi' },
  { key: 'two', furni: 'import' },
  { key: 'three', furni: 'leaderboard' },
] as const;

const enter = (delay: number, from: 'up' | 'right' = 'up') => ({
  initial: { opacity: 0, ...(from === 'up' ? { y: 20 } : { x: 20 }) },
  animate: { opacity: 1, x: 0, y: 0 },
  transition: { duration: 0.8, delay },
});

function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative flex min-h-[90vh] w-full items-center justify-center overflow-hidden px-4 pt-20 pb-10 md:px-8">
      <NightSky />

      <div className="relative z-30 grid w-full max-w-6xl auto-rows-[minmax(200px,auto)] grid-cols-1 gap-6 md:grid-cols-3">
        <motion.div
          {...enter(0.1)}
          className="flex flex-col items-start justify-center text-left md:col-span-2"
        >
          <h1 className="mb-4 flex flex-col items-start gap-3">
            <img
              src={HABBODAN_LOGO}
              alt="Habbodan"
              className="h-14 w-auto object-contain drop-shadow-lg md:h-20"
            />
            <span className="bg-gradient-to-br from-white to-sky-100 bg-clip-text text-5xl leading-none font-black tracking-tight text-transparent drop-shadow-sm md:text-7xl">
              WIRED<span className="text-sky-400">PORTAL</span>
            </span>
          </h1>
          <p className="max-w-lg text-lg leading-relaxed font-medium text-sky-100/80 md:text-xl">
            {t('home.subtitle')}
          </p>
        </motion.div>

        <motion.div
          {...enter(0.3, 'right')}
          whileHover={{ y: -5 }}
          className="glass relative flex flex-col justify-between overflow-hidden rounded-3xl p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{t('home.quickStart.title')}</h3>
              <p className="mt-1 text-xs font-medium tracking-wide text-sky-200/70 uppercase">
                {t('home.quickStart.caption')}
              </p>
            </div>
            <Link
              to="/workspaces"
              aria-label={t('home.cta')}
              className="flex size-12 items-center justify-center rounded-full bg-white/90 text-sky-600 shadow-lg transition-all hover:scale-105 hover:bg-white active:scale-95"
            >
              <ArrowRight className="size-6" />
            </Link>
          </div>
          <div className="mt-6 flex h-14 w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] px-3 shadow-sm backdrop-blur-md">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-400/15">
              <WiredFurni name="webApi" size={30} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold text-white">
                {t('home.quickStart.item')}
              </span>
              <span className="block truncate text-[10px] font-medium text-sky-200/70">
                {t('home.quickStart.itemCaption')}
              </span>
            </span>
          </div>
        </motion.div>

        <Link to="/workspaces" className="group block h-full md:col-span-2">
          <motion.div
            {...enter(0.4)}
            whileHover={{ scale: 1.02 }}
            className="relative h-full min-h-[300px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-800 to-indigo-900">
              <img
                src={FURNI_BACKGROUND}
                alt=""
                className="size-full object-cover opacity-25 mix-blend-luminosity transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-6 pb-24 md:gap-10">
                <WiredFurni name="user" size={72} className="drop-shadow-xl" />
                <WiredFurni name="furni" size={88} className="drop-shadow-xl" />
                <WiredFurni name="room" size={72} className="drop-shadow-xl" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-night-950/95 via-night-950/40 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 z-10 w-full p-8">
              <div className="mb-3 inline-block rounded-lg bg-sky-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                {t('home.featured.tag')}
              </div>
              <h2 className="mb-2 text-3xl leading-tight font-bold text-white drop-shadow-md md:text-4xl">
                {t('home.featured.title')}
              </h2>
              <p className="flex items-center gap-2 text-sm font-medium text-sky-100">
                {t('home.featured.body')}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </p>
            </div>
          </motion.div>
        </Link>

        <div className="flex flex-col gap-6">
          <a href={API_DOCS_URL} target="_blank" rel="noreferrer" className="flex-1">
            <motion.div
              {...enter(0.5, 'right')}
              whileHover={{ scale: 1.02, y: -2 }}
              className="group relative flex h-full min-h-[140px] items-center overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-sky-500/90 to-blue-700/90 p-5 shadow-lg"
            >
              <div className="relative z-10">
                <h4 className="mb-2 text-2xl leading-none font-black text-white drop-shadow-md">
                  {t('home.docsCard.title')}
                </h4>
                <p className="text-sm leading-tight font-medium text-white/90">
                  {t('home.docsCard.body')}
                </p>
              </div>
              <WiredFurni
                name="changed"
                size={128}
                className="absolute -right-4 -bottom-6 z-0 opacity-90 drop-shadow-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2"
              />
            </motion.div>
          </a>

          <a href={REPOSITORY_URL} target="_blank" rel="noreferrer" className="flex-1">
            <motion.div
              {...enter(0.6, 'right')}
              whileHover={{ scale: 1.02, y: -2 }}
              className="group relative flex h-full min-h-[140px] items-center overflow-hidden rounded-3xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/25 to-purple-500/10 p-5 shadow-lg backdrop-blur-xl"
            >
              <div className="absolute top-0 right-0 -mt-10 -mr-10 size-20 rounded-full bg-purple-400/20 blur-2xl" />
              <div className="relative z-10">
                <span
                  lang="en"
                  className="flex items-center gap-1 text-xs font-bold tracking-wider text-indigo-300 uppercase"
                >
                  <span className="size-2 animate-pulse rounded-full bg-indigo-400" /> GitHub
                </span>
                <h4 className="mt-1 text-xl leading-tight font-bold text-white">
                  {t('home.sourceCard.title')}
                </h4>
                <p className="mt-1 text-xs font-medium text-indigo-200/70">
                  {t('home.sourceCard.body')} &rarr;
                </p>
              </div>
              <WiredFurni
                name="leaderboard"
                size={112}
                className="absolute -right-6 -bottom-6 z-0 drop-shadow-md transition-transform duration-500 group-hover:scale-110"
              />
            </motion.div>
          </a>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-32 bg-gradient-to-t from-night-950 via-night-950/80 to-transparent" />
    </section>
  );
}

export function HomePage() {
  const { t } = useTranslation();

  return (
    <>
      <Hero />

      <section className="relative z-10 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 text-4xl font-bold text-white md:text-5xl"
            >
              {t('home.steps.title')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-sky-100/70"
            >
              {t('home.steps.subtitle')}
            </motion.p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map(({ key, furni }, index) => (
              <motion.article
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="card relative overflow-hidden p-6"
              >
                <span className="absolute top-5 right-6 text-5xl font-black text-white/[0.06]">
                  {index + 1}
                </span>
                <div className="flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                  <WiredFurni name={furni} size={44} />
                </div>
                <h3 className="mt-5 text-xl font-bold text-white">
                  {t(`home.steps.${key}.title`)}
                </h3>
                <p className="mt-2 leading-relaxed text-sky-100/60">
                  {t(`home.steps.${key}.body`)}
                </p>
              </motion.article>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card mt-6 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center"
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
              <ShieldCheck className="size-7" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white">{t('home.security.title')}</h3>
              <p className="mt-1 text-sky-100/60">{t('home.security.body')}</p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
