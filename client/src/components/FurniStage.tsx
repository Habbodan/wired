import type { ReactNode } from 'react';
import clsx from 'clsx';
import { FURNI_BACKGROUND } from './links';
import { WiredFurni, type FurniName } from './WiredFurni';

interface FurniStageProps {
  name: FurniName;
  size: number;
  className?: string;
  furniClassName?: string;
  children?: ReactNode;
}

export function FurniStage({ name, size, className, furniClassName, children }: FurniStageProps) {
  return (
    <div className={clsx('relative flex items-center justify-center overflow-hidden', className)}>
      <img
        src={FURNI_BACKGROUND}
        alt=""
        draggable={false}
        className="absolute inset-0 size-full object-cover opacity-80"
      />
      <WiredFurni
        name={name}
        size={size}
        className={clsx('relative drop-shadow-xl', furniClassName)}
      />
      {children}
    </div>
  );
}
