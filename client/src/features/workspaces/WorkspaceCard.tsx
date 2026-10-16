import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Eye, PencilLine } from 'lucide-react';
import clsx from 'clsx';
import { findHotel } from '@shared/hotels';
import type { WorkspaceSummary } from '@shared/wired';
import { FurniStage } from '@/components/FurniStage';
import { HotelFlag } from '@/components/HotelFlag';
import { relativeTime } from '@/lib/habbo';

const cardMotion = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
} as const;

function KeyChip({
  active,
  label,
  icon,
}: {
  active: boolean;
  label: string;
  icon: 'read' | 'write';
}) {
  const Icon = icon === 'read' ? Eye : PencilLine;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold',
        !active && 'border-slate-100 bg-slate-50 text-slate-300',
        active && icon === 'read' && 'border-sky-100 bg-sky-50 text-sky-600',
        active && icon === 'write' && 'border-amber-200 bg-amber-50 text-amber-600',
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}

export function WorkspaceCard({ workspace }: { workspace: WorkspaceSummary }) {
  const { t, i18n } = useTranslation();

  return (
    <motion.div variants={cardMotion} whileHover={{ y: -5 }} className="h-full">
      <Link
        to={`/w/${workspace.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md transition-shadow duration-300 hover:shadow-xl"
      >
        <FurniStage
          name="webApi"
          size={76}
          className="h-36"
          furniClassName="transition-transform duration-500 group-hover:scale-110"
        >
          <span className="absolute top-3 left-3 rounded-xl border border-slate-100 bg-white/90 p-1.5 shadow-sm backdrop-blur-sm">
            <HotelFlag hotel={workspace.hotel} className="size-5" />
          </span>
          <span className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
        </FurniStage>
        <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-ink">{workspace.name}</h3>
            <p className="truncate text-xs text-slate-400">
              {findHotel(workspace.hotel)?.name} · {t('workspaces.room', { id: workspace.roomId })}
            </p>
          </div>
          <div className="mt-auto flex items-center gap-1.5">
            <KeyChip active={workspace.hasReadKey} label={t('workspaces.readKey')} icon="read" />
            <KeyChip active={workspace.hasWriteKey} label={t('workspaces.writeKey')} icon="write" />
            <span className="ml-auto text-[11px] text-slate-400">
              {relativeTime(workspace.updatedAt, i18n.language)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
