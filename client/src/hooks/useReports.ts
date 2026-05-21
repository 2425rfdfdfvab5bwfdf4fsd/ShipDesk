import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Report, ReportMeta, ReportContent } from "../types";

export function useReports(projectId?: string, status?: string) {
  return useQuery<{ reports: ReportMeta[]; total: number }>({
    queryKey: ["reports", projectId, status],
    queryFn: () =>
      api
        .get("/api/reports", { params: { projectId, status, limit: 50 } })
        .then((r) => r.data),
  });
}

export function useReport(id: string) {
  return useQuery<Report>({
    queryKey: ["report", id],
    queryFn: () => api.get(`/api/reports/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      api.post(`/api/reports/generate/${projectId}`).then((r) => r.data),
    onSuccess: (_data, projectId) => {
      qc.invalidateQueries({ queryKey: ["reports", projectId] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { content?: Partial<ReportContent>; status?: "PUBLISHED" };
    }) => api.patch(`/api/reports/${id}`, data).then((r) => r.data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["report", id] });
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/reports/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}
