import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { MAX_ACTIVITY, type Pin, type Workspace, type WorkspaceState } from '@shared/wired';
import { createWiredClient, type WiredClient } from '@/lib/wired/client';
import { useSaveWorkspace } from '@/features/workspaces/hooks';

const SAVE_DELAY_MS = 1500;

interface ConsoleValue {
  workspace: Workspace;
  client: WiredClient;
  state: WorkspaceState;
  togglePin: (pin: Omit<Pin, 'id'>) => void;
  findPin: (pin: Omit<Pin, 'id' | 'label'>) => Pin | undefined;
  removePin: (id: string) => void;
  clearActivity: () => void;
}

const ConsoleContext = createContext<ConsoleValue | null>(null);

const samePin = (a: Omit<Pin, 'id' | 'label'>, b: Omit<Pin, 'id' | 'label'>) =>
  a.scope === b.scope &&
  a.variable === b.variable &&
  a.targetKind === b.targetKind &&
  a.entityId === b.entityId;

function usePersistedState(workspace: Workspace) {
  const { mutate } = useSaveWorkspace();
  const [state, setState] = useState(workspace.state);
  const savedState = useRef(workspace.state);
  const { id, name, hotel, roomId } = workspace;

  useEffect(() => {
    if (state === savedState.current) return;
    const timer = setTimeout(() => {
      savedState.current = state;
      mutate({ id, input: { name, hotel, roomId, state } });
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state, mutate, id, name, hotel, roomId]);

  return [state, setState] as const;
}

export function ConsoleProvider({
  workspace,
  children,
}: {
  workspace: Workspace;
  children: ReactNode;
}) {
  const [state, setState] = usePersistedState(workspace);

  const client = useMemo(
    () =>
      createWiredClient({
        hotel: workspace.hotel,
        roomId: workspace.roomId,
        readKey: workspace.readKey,
        writeKey: workspace.writeKey,
        onActivity: (entry) =>
          setState((current) => ({
            ...current,
            activity: [
              { ...entry, id: crypto.randomUUID(), at: new Date().toISOString() },
              ...current.activity,
            ].slice(0, MAX_ACTIVITY),
          })),
      }),
    [workspace.hotel, workspace.roomId, workspace.readKey, workspace.writeKey, setState],
  );

  const findPin = useCallback(
    (pin: Omit<Pin, 'id' | 'label'>) => state.pins.find((item) => samePin(item, pin)),
    [state.pins],
  );

  const togglePin = useCallback(
    (pin: Omit<Pin, 'id'>) =>
      setState((current) => {
        const exists = current.pins.some((item) => samePin(item, pin));
        return {
          ...current,
          pins: exists
            ? current.pins.filter((item) => !samePin(item, pin))
            : [...current.pins, { ...pin, id: crypto.randomUUID() }],
        };
      }),
    [setState],
  );

  const removePin = useCallback(
    (id: string) =>
      setState((current) => ({ ...current, pins: current.pins.filter((pin) => pin.id !== id) })),
    [setState],
  );

  const clearActivity = useCallback(
    () => setState((current) => ({ ...current, activity: [] })),
    [setState],
  );

  const value = useMemo(
    () => ({ workspace, client, state, togglePin, findPin, removePin, clearActivity }),
    [workspace, client, state, togglePin, findPin, removePin, clearActivity],
  );

  return <ConsoleContext value={value}>{children}</ConsoleContext>;
}

export function useConsole(): ConsoleValue {
  const value = useContext(ConsoleContext);
  if (!value) throw new Error('useConsole must be used inside ConsoleProvider');
  return value;
}
