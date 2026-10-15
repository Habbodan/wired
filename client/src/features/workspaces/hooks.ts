import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Workspace, WorkspaceUpsert } from '@shared/wired';
import { useSession } from '@/features/auth/session';
import { accountRepository, localRepository, type WorkspaceRepository } from './repository';

export function useRepository(): WorkspaceRepository | null {
  const session = useSession();
  if (session.isPending) return null;
  return session.data ? accountRepository : localRepository;
}

function ready(repo: WorkspaceRepository | null): WorkspaceRepository {
  if (!repo) throw new Error('Workspace storage is not ready');
  return repo;
}

const listKey = (repo: WorkspaceRepository | null) => ['workspaces', repo?.kind, 'list'] as const;
const itemKey = (repo: WorkspaceRepository | null, id: string) =>
  ['workspaces', repo?.kind, 'item', id] as const;

export function useWorkspaceList() {
  const repo = useRepository();
  return useQuery({
    queryKey: listKey(repo),
    queryFn: () => ready(repo).list(),
    enabled: repo !== null,
  });
}

export function useWorkspace(id: string, enabled = true) {
  const repo = useRepository();
  return useQuery({
    queryKey: itemKey(repo, id),
    queryFn: () => ready(repo).get(id),
    enabled: enabled && repo !== null,
    staleTime: Infinity,
  });
}

export function useSaveWorkspace() {
  const repo = useRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: WorkspaceUpsert }) => {
      return ready(repo).save(id, input);
    },
    onSuccess: (workspace: Workspace) => {
      queryClient.setQueryData(itemKey(repo, workspace.id), workspace);
      void queryClient.invalidateQueries({ queryKey: listKey(repo) });
    },
  });
}

export function useRemoveWorkspace() {
  const repo = useRepository();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return ready(repo).remove(id);
    },
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: itemKey(repo, id) });
      void queryClient.invalidateQueries({ queryKey: listKey(repo) });
    },
  });
}

export function useLocalWorkspacesForImport() {
  const session = useSession();
  return useQuery({
    queryKey: ['workspaces', 'local', 'list'],
    queryFn: () => localRepository.list(),
    enabled: Boolean(session.data),
  });
}

export function useImportLocalWorkspaces() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const summaries = await localRepository.list();
      for (const summary of summaries) {
        const workspace = await localRepository.get(summary.id);
        if (!workspace) continue;
        await accountRepository.save(workspace.id, {
          name: workspace.name,
          hotel: workspace.hotel,
          roomId: workspace.roomId,
          readKey: workspace.readKey,
          writeKey: workspace.writeKey,
          state: workspace.state,
        });
        await localRepository.remove(workspace.id);
      }
      return summaries.length;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}
