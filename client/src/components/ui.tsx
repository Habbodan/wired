import clsx from 'clsx';
import { ChevronDown, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useId, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-sky-500 text-white shadow-[0_8px_20px_-8px_rgb(14_165_233/0.8)] hover:bg-sky-600',
  secondary: 'border border-line bg-white text-ink shadow-sm hover:border-sky-200 hover:bg-sky-50',
  ghost: 'text-slate-500 hover:bg-sky-50 hover:text-sky-700',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-2xl px-6 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', className?: string) =>
  clsx(
    'inline-flex shrink-0 items-center justify-center font-bold whitespace-nowrap transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  );

export function Button({
  variant,
  size,
  loading,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

const controlClass =
  'h-11 w-full rounded-xl border border-line bg-field px-3.5 text-sm text-slate-800 placeholder:text-slate-400 transition-colors hover:border-line-strong focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 focus:outline-none disabled:opacity-50';

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string | undefined;
  children: (id: string, describedBy: string | undefined) => ReactNode;
  className?: string;
}

export function Field({ label, hint, error, children, className }: FieldProps) {
  const id = useId();
  const describedBy = error || hint ? `${id}-desc` : undefined;
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children(id, describedBy)}
      {(error || hint) && (
        <p id={describedBy} className={clsx('text-xs', error ? 'text-red-500' : 'text-slate-400')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...rest }: ComponentProps<'input'>) {
  return <input className={clsx(controlClass, className)} {...rest} />;
}

export function Select({ className, ...rest }: ComponentProps<'select'>) {
  return (
    <div className={clsx('relative', className)}>
      <select className={clsx(controlClass, 'cursor-pointer appearance-none pr-10')} {...rest} />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  options: readonly { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: SegmentedProps<T>) {
  const group = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={clsx('flex gap-1 overflow-x-auto rounded-xl bg-slate-100/80 p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={clsx(
              'relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors',
              active ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600',
            )}
          >
            {active && (
              <motion.span
                layoutId={group}
                className="absolute inset-0 rounded-lg bg-white shadow-sm"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative flex items-center gap-2">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

type Tone = 'neutral' | 'sky' | 'amber' | 'emerald';

const TONES: Record<Tone, string> = {
  neutral: 'border-slate-200 bg-white text-slate-500',
  sky: 'border-sky-100 bg-sky-50 text-sky-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('size-6 animate-spin text-sky-500', className)} aria-hidden />;
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon}
      <p className="text-lg font-bold text-ink">{title}</p>
      {children && <div className="max-w-md text-sm text-slate-500">{children}</div>}
    </div>
  );
}
