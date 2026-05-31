import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface LinearStatus {
  connected: boolean;
  linearUserId: string | null;
  linearOrganizationId: string | null;
  organizationName: string | null;
  connectedAt: string | null;
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export function useLinearStatus() {
  return useQuery<LinearStatus>({
    queryKey: ["linear-status"],
    queryFn: () => api.get("/api/linear/status").then((r) => r.data),
    staleTime: 60_000,
    retry: false,
  });
}

export function useLinearTeams(enabled = false) {
  return useQuery<{ teams: LinearTeam[] }>({
    queryKey: ["linear-teams"],
    queryFn: () => api.get("/api/linear/teams").then((r) => r.data),
    enabled,
    staleTime: 60_000,
    retry: false,
  });
}

export function useDisconnectLinear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete("/api/linear/disconnect").then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["linear-status"] });
      qc.invalidateQueries({ queryKey: ["linear-teams"] });
    },
  });
}
