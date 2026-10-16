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
        <span className="font-mono text-sm font-semibold text-ink tabular-nums">{value}</span>
        {canEdit && (
          <button
            type="button"
            onClick={() => setDraft(value)}
            className="rounded-md p-1 text-slate-400 hover:bg-sky-50 hover:text-sky-700"
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
        className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
        aria-label={t('common.save')}
      >
        <Check className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => setDraft(null)}
        className="rounded-md p-1.5 text-slate-500 hover:bg-sky-50"
        aria-label={t('common.cancel')}
      >
        <X className="size-4" />
      </button>
    </form>
  );
}
