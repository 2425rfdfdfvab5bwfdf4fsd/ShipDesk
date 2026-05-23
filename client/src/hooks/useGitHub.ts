import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

interface GitHubRepo {
  id: number;
  full_name: string;
  private: boolean;
  pushed_at: string;
}

export function useGitHubStatus() {
  return useQuery<{ connected: boolean; login: string | null }>({
    queryKey: ["github-status"],
    queryFn: () => api.get("/api/github/status").then((r) => r.data),
    staleTime: 60_000,
    retry: false,
  });
}

export function useGitHubRepos(search?: string, enabled = false) {
  return useQuery<GitHubRepo[]>({
    queryKey: ["github-repos", search],
    queryFn: () =>
      api
        .get("/api/github/repos", { params: search ? { q: search } : {} })
        .then((r) => r.data),
    enabled,
    retry: false,
    staleTime: 30_000,
  });
}

export function useConnectRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      repoFullName,
    }: {
      projectId: string;
      repoFullName: string;
    }) =>
      api
        .post("/api/github/connect-repo", { projectId, repoFullName })
        .then((r) => r.data),
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDisconnectRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      api
        .delete(`/api/github/disconnect-repo/${projectId}`)
        .then((r) => r.data),
    onSuccess: (_data, projectId) => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useReregisterWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      api
        .post(`/api/github/reregister-webhook/${projectId}`)
        .then((r) => r.data),
    onSuccess: (_data, projectId) => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });
}
