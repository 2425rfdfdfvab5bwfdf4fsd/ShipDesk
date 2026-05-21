import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Project, ReportMeta, Report, ProjectFile, Message, Invoice, ScopeChange } from "../types";

export function useClientProjects() {
  return useQuery<Project[]>({
    queryKey: ["portal-projects"],
    queryFn: () => api.get("/api/portal/projects").then((r) => r.data),
  });
}

export function useClientProject(id: string) {
  return useQuery<Project>({
    queryKey: ["portal-project", id],
    queryFn: () => api.get(`/api/portal/projects/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useClientReports(projectId: string) {
  return useQuery<ReportMeta[]>({
    queryKey: ["portal-reports", projectId],
    queryFn: () =>
      api.get(`/api/portal/projects/${projectId}/reports`).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useClientReport(projectId: string, reportId: string) {
  return useQuery<Report>({
    queryKey: ["portal-report", projectId, reportId],
    queryFn: () =>
      api
        .get(`/api/portal/projects/${projectId}/reports/${reportId}`)
        .then((r) => r.data),
    enabled: !!projectId && !!reportId,
  });
}

export function useClientFiles(projectId: string) {
  return useQuery<ProjectFile[]>({
    queryKey: ["portal-files", projectId],
    queryFn: () =>
      api.get(`/api/portal/projects/${projectId}/files`).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useClientMessages(projectId: string) {
  return useQuery<{ messages: Message[]; nextCursor: string | null }>({
    queryKey: ["portal-messages", projectId],
    queryFn: () =>
      api
        .get(`/api/portal/projects/${projectId}/messages`, {
          params: { limit: 50 },
        })
        .then((r) => r.data),
    refetchInterval: 10000,
    enabled: !!projectId,
  });
}

export function useClientInvoices(projectId: string) {
  return useQuery<Invoice[]>({
    queryKey: ["portal-invoices", projectId],
    queryFn: () =>
      api
        .get(`/api/portal/projects/${projectId}/invoices`)
        .then((r) => r.data),
    refetchInterval: 10000,
    enabled: !!projectId,
  });
}

export function useClientScopeChanges(projectId: string) {
  return useQuery<ScopeChange[]>({
    queryKey: ["portal-scope-changes", projectId],
    queryFn: () =>
      api
        .get(`/api/portal/projects/${projectId}/scope-changes`)
        .then((r) => r.data),
    refetchInterval: 10000,
    enabled: !!projectId,
  });
}

export function useSubmitClientScopeChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      ...data
    }: {
      projectId: string;
      title: string;
      description: string;
      urgency: "LOW" | "MEDIUM" | "HIGH";
    }) =>
      api
        .post(`/api/portal/projects/${projectId}/scope-changes`, data)
        .then((r) => r.data),
    onSuccess: (_d, { projectId }) =>
      qc.invalidateQueries({ queryKey: ["portal-scope-changes", projectId] }),
  });
}

export function useRespondToScopeChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: string;
      decision: "APPROVED" | "DECLINED";
    }) =>
      api
        .patch(`/api/portal/scope-changes/${id}/respond`, { decision })
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["portal-scope-changes"] }),
  });
}

export function useSendClientMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, body }: { projectId: string; body: string }) =>
      api
        .post(`/api/portal/projects/${projectId}/messages`, { body })
        .then((r) => r.data),
    onSuccess: (_d, { projectId }) =>
      qc.invalidateQueries({ queryKey: ["portal-messages", projectId] }),
  });
}

export function useMarkClientMessagesRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      api
        .patch(`/api/portal/projects/${projectId}/messages/read`)
        .then((r) => r.data),
    onSuccess: (_d, projectId) =>
      qc.invalidateQueries({ queryKey: ["portal-messages", projectId] }),
  });
}
