import { useQuery } from '@tanstack/react-query';
import { useConsole } from './ConsoleContext';

export const wiredKey = (workspaceId: string, ...parts: unknown[]) => [
  'wired',
  workspaceId,
  ...parts,
];

export function useRoomVariables() {
  const { workspace, client } = useConsole();
  return useQuery({
    queryKey: wiredKey(workspace.id, 'variables'),
    queryFn: () => client.listVariables(),
    enabled: client.hasReadKey,
    staleTime: 30_000,
    retry: false,
  });
}
