import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Workspace, OnboardingStatus } from "../types";

export function useWorkspace() {
  return useQuery<Workspace>({
    queryKey: ["workspace"],
    queryFn: () => api.get("/api/workspace").then((r) => r.data),
    retry: false,
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

export function useCheckSubdomain(slug: string) {
  return useQuery<{ available: boolean }>({
    queryKey: ["check-subdomain", slug],
    queryFn: () =>
      api.get(`/api/workspace/check-subdomain?slug=${slug}`).then((r) => r.data),
    enabled: slug.length >= 3,
  });
}
