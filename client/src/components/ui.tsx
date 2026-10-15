import clsx from 'clsx';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useId, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-sky-500 text-white shadow-lg shadow-sky-500/20 hover:bg-sky-600',
  secondary: 'glass text-sky-50 hover:bg-white/10',
  ghost: 'text-sky-200/80 hover:bg-white/[0.06] hover:text-white',
  danger: 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600',
};

const SIZES: Record<Size, string> = {
  sm: 'gap-1.5 rounded-lg px-3 py-2 text-xs',
  md: 'gap-2 rounded-xl px-5 py-3 text-sm',
  lg: 'gap-2 rounded-xl px-6 py-4 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', className?: string) =>
  clsx(
    'inline-flex shrink-0 items-center justify-center font-bold whitespace-nowrap transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
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
  'w-full rounded-xl border-2 border-sky-900/60 bg-night-950/60 px-4 py-3 text-sm font-bold text-sky-50 placeholder:font-medium placeholder:text-sky-200/30 transition-all focus:border-sky-500 focus:bg-night-950 focus:outline-none disabled:opacity-50';

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
    <div className={clsx('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="field-label ml-1">
        {label}
      </label>
      {children(id, describedBy)}
      {(error || hint) && (
        <p
          id={describedBy}
          className={clsx('ml-1 text-xs', error ? 'font-semibold text-red-300' : 'text-sky-200/50')}
        >
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
      <select className={clsx(controlClass, 'cursor-pointer appearance-none pr-11')} {...rest} />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-sky-300/70"
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
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={clsx('flex gap-1 overflow-x-auto rounded-2xl bg-white/[0.05] p-1', className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={clsx(
            'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all',
            option.value === value
              ? 'bg-sky-500/15 text-sky-300 shadow-sm ring-1 ring-sky-400/30'
              : 'text-sky-200/50 hover:text-sky-100',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Pill({
  tone = 'glass',
  children,
}: {
  tone?: 'glass' | 'sky' | 'orange';
  children: ReactNode;
}) {
  const tones = {
    glass: 'border-white/15 bg-white/10 text-sky-100',
    sky: 'border-sky-400/30 bg-sky-500/15 text-sky-200',
    orange: 'border-habbo-orange/30 bg-habbo-orange/15 text-orange-200',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('size-6 animate-spin text-sky-400', className)} aria-hidden />;
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
      <p className="text-lg font-bold text-white">{title}</p>
      {children && <div className="max-w-md text-sm text-sky-200/60">{children}</div>}
    </div>
  );
}
