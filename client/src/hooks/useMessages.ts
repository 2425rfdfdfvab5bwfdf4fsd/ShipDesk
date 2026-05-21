import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Message } from "../types";

export function useMessages(projectId: string) {
  return useQuery<{ messages: Message[]; nextCursor: string | null }>({
    queryKey: ["messages", projectId],
    queryFn: () =>
      api
        .get(`/api/projects/${projectId}/messages`, { params: { limit: 50 } })
        .then((r) => r.data),
    refetchInterval: 10000,
    enabled: !!projectId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, body }: { projectId: string; body: string }) =>
      api
        .post(`/api/projects/${projectId}/messages`, { body })
        .then((r) => r.data),
    onSuccess: (_data, { projectId }) =>
      qc.invalidateQueries({ queryKey: ["messages", projectId] }),
  });
}

export function useMarkMessagesRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      api
        .patch(`/api/projects/${projectId}/messages/read`)
        .then((r) => r.data),
    onSuccess: (_data, projectId) =>
      qc.invalidateQueries({ queryKey: ["messages", projectId] }),
  });
}
