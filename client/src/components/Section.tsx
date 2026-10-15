import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { NightSky } from './NightSky';

interface SectionProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Section({ title, subtitle, action, children }: SectionProps) {
  return (
    <section className="relative min-h-[80vh]">
      <NightSky className="h-[420px]" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-20 pb-12 md:px-6 md:pt-24">
        <div className="mb-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-4xl font-bold text-white md:text-5xl"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-sky-100/80"
            >
              {subtitle}
            </motion.p>
          )}
          {action && <div className="mt-8 flex justify-center">{action}</div>}
        </div>
        {children}
      </div>
    </section>
  );
}
