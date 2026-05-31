import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface VercelStatus {
  connected: boolean;
  vercelProjectId: string | null;
  connectedAt: string | null;
}

export function useVercelStatus(projectId: string | undefined) {
  return useQuery<VercelStatus>({
    queryKey: ["vercel-status", projectId],
    queryFn: () =>
      api.get(`/api/projects/${projectId}/vercel/status`).then((r) => r.data),
    enabled: !!projectId,
    staleTime: 60_000,
    retry: false,
  });
}

export function useConnectVercel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      apiToken,
      vercelProjectId,
    }: {
      projectId: string;
      apiToken: string;
      vercelProjectId: string;
    }) =>
      api
        .post(`/api/projects/${projectId}/vercel/connect`, {
          apiToken,
          vercelProjectId,
        })
        .then((r) => r.data),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ["vercel-status", projectId] });
    },
  });
}

export function useDisconnectVercel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      api
        .delete(`/api/projects/${projectId}/vercel/disconnect`)
        .then((r) => r.data),
    onSuccess: (_data, projectId) => {
      qc.invalidateQueries({ queryKey: ["vercel-status", projectId] });
    },
  });
}
