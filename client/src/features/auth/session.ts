import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SessionUser } from '@shared/wired';
import { api } from '@/lib/http';

export const sessionQueryKey = ['session'] as const;

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: async () => (await api<{ user: SessionUser | null }>('/api/me')).user,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryOnMount: false,
  });
}

export function loginHref(returnTo: string): string {
  return `/auth/login?${new URLSearchParams({ returnTo })}`;
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<undefined>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryKey, null);
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'workspaces' });
    },
  });
}
