import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Client } from "../types";

export function useProjectClients(projectId: string) {
  return useQuery<Client[]>({
    queryKey: ["project-clients", projectId],
    queryFn: () =>
      api.get(`/api/projects/${projectId}/clients`).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useInviteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, email }: { projectId: string; email: string }) =>
      api
        .post(`/api/projects/${projectId}/invite`, { email })
        .then((r) => r.data),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ["project-clients", projectId] });
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });
}

export function useRevokeClientAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      clientId,
    }: {
      projectId: string;
      clientId: string;
    }) =>
      api
        .delete(`/api/projects/${projectId}/clients/${clientId}`)
        .then((r) => r.data),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ["project-clients", projectId] });
    },
  });
}
