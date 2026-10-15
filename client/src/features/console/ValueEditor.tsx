import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Pencil, X } from 'lucide-react';
import { variableValueSchema } from '@shared/wired';
import { Input } from '@/components/ui';

interface ValueEditorProps {
  value: string;
  canEdit: boolean;
  saving?: boolean;
  onSave: (value: string) => void;
}

export function ValueEditor({ value, canEdit, saving, onSave }: ValueEditorProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<string | null>(null);

  if (draft === null) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-white tabular-nums">{value}</span>
        {canEdit && (
          <button
            type="button"
            onClick={() => setDraft(value)}
            className="rounded-md p-1 text-sky-200/40 hover:bg-white/[0.06] hover:text-white"
            aria-label={t('common.edit')}
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      </div>
    );
  }

  const valid = variableValueSchema.safeParse(draft).success;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    onSave(draft);
    setDraft(null);
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-1.5">
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value.replace(/[^\d-]/g, ''))}
        inputMode="numeric"
        autoFocus
        aria-invalid={!valid}
        aria-label={t('explorer.value')}
        className="h-8 w-32 font-mono"
        onKeyDown={(event) => event.key === 'Escape' && setDraft(null)}
      />
      <button
        type="submit"
        disabled={!valid || saving}
        className="rounded-md p-1.5 text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-40"
        aria-label={t('common.save')}
      >
        <Check className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => setDraft(null)}
        className="rounded-md p-1.5 text-sky-200/60 hover:bg-white/[0.06]"
        aria-label={t('common.cancel')}
      >
        <X className="size-4" />
      </button>
    </form>
  );
}
