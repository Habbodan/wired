import clsx from 'clsx';

export function NightSky({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-sky-900 via-night-900 to-night-950" />
      <div className="absolute inset-0 opacity-60">
        <div className="absolute top-[10%] left-[5%] h-32 w-64 animate-float rounded-full bg-sky-200/10 blur-3xl" />
        <div className="absolute top-[20%] right-[10%] h-48 w-96 animate-float rounded-full bg-sky-200/10 blur-3xl [animation-delay:700ms]" />
        <div className="absolute bottom-[30%] left-[20%] h-40 w-80 animate-float rounded-full bg-indigo-200/10 blur-2xl [animation-delay:300ms]" />
      </div>
      <div className="absolute top-[15%] left-[25%] h-20 w-48 animate-float rounded-full bg-white/[0.07] blur-lg" />
      <div className="absolute top-[40%] right-[20%] h-28 w-64 animate-float rounded-full bg-white/[0.06] blur-md [animation-delay:500ms]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-night-950 via-night-950/80 to-transparent" />
    </div>
  );
}
