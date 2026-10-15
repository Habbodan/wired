import { useSearchParams } from 'react-router';
import type { Scope } from '@shared/wired';

export const CONSOLE_TABS = ['overview', 'explorer', 'profiles', 'tools', 'activity'] as const;
export type ConsoleTab = (typeof CONSOLE_TABS)[number];

export function parseTab(value: string | null): ConsoleTab {
  return CONSOLE_TABS.find((tab) => tab === value) ?? 'overview';
}

export interface ExplorerTarget {
  scope: Scope;
  variable: string;
  kind?: string | undefined;
  entity?: string | undefined;
}

export function useOpenExplorer() {
  const [, setParams] = useSearchParams();
  return ({ scope, variable, kind, entity }: ExplorerTarget) => {
    const next = new URLSearchParams({ tab: 'explorer', scope, variable });
    if (kind) next.set('kind', kind);
    if (entity) next.set('entity', entity);
    setParams(next);
  };
}
