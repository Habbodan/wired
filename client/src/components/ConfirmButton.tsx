import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui';

interface ConfirmButtonProps {
  question: string;
  confirmLabel: string;
  onConfirm: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  icon?: ReactNode;
  children: ReactNode;
}

export function ConfirmButton({
  question,
  confirmLabel,
  onConfirm,
  loading,
  disabled,
  size = 'md',
  icon,
  children,
}: ConfirmButtonProps) {
  const { t } = useTranslation();
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <Button
        variant="ghost"
        size={size}
        icon={icon}
        disabled={disabled}
        onClick={() => setAsking(true)}
      >
        {children}
      </Button>
    );
  }

  return (
    <div role="alertdialog" className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-red-200">{question}</span>
      <Button
        variant="danger"
        size={size}
        loading={loading}
        onClick={() => {
          onConfirm();
          setAsking(false);
        }}
      >
        {confirmLabel}
      </Button>
      <Button variant="ghost" size={size} onClick={() => setAsking(false)}>
        {t('common.cancel')}
      </Button>
    </div>
  );
}
