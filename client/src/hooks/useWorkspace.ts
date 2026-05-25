import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Workspace, OnboardingStatus, TeamData } from "../types";

export function useWorkspace() {
  return useQuery<Workspace>({
    queryKey: ["workspace"],
    queryFn: () => api.get("/api/workspace").then((r) => r.data),
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return false;
      return failureCount < 3;
    },
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 5000),
  });
}

export function useOnboardingStatus() {
  return useQuery<OnboardingStatus>({
    queryKey: ["onboarding-status"],
    queryFn: () => api.get("/api/workspace/onboarding-status").then((r) => r.data),
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      slug: string;
      agencyName?: string;
      logoUrl?: string;
      primaryColor?: string;
    }) => api.post("/api/workspace", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace"] }),
  });
}

export function useUpdateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Workspace>) =>
      api.patch("/api/workspace", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace"] }),
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/api/workspace/onboarding-complete").then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace"] });
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });
}

export function useUnreadMessageCount() {
  return useQuery<{ count: number }>({
    queryKey: ["unread-count"],
    queryFn: () => api.get("/api/workspace/unread-count").then((r) => r.data),
    refetchInterval: 15000,
  });
}

export function useCheckSubdomain(slug: string) {
  return useQuery<{ available: boolean }>({
    queryKey: ["check-subdomain", slug],
    queryFn: () =>
      api.get(`/api/workspace/check-subdomain?slug=${slug}`).then((r) => r.data),
    enabled: slug.length >= 3,
  });
}

export function useTeam() {
  return useQuery<TeamData>({
    queryKey: ["workspace-team"],
    queryFn: () => api.get("/api/workspace/team").then((r) => r.data),
  });
}

export function useInviteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      api.post("/api/workspace/team/invite", { email }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace-team"] }),
  });
}

export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/api/workspace/team/members/${memberId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace-team"] }),
  });
}

export function useCancelTeamInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      api.delete(`/api/workspace/team/invitations/${invitationId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace-team"] }),
  });
}

export function useJoinTeam() {
  return useMutation({
    mutationFn: (token: string) =>
      api.post("/api/workspace/team/join", { token }).then((r) => r.data),
  });
}
