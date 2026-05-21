import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ScopeChange, Currency } from "../types";

export function useScopeChanges(projectId?: string, status?: string) {
  return useQuery<ScopeChange[]>({
    queryKey: ["scope-changes", projectId, status],
    queryFn: () =>
      api
        .get("/api/scope-changes", { params: { projectId, status } })
        .then((r) => r.data),
  });
}

export function useScopeChange(id: string) {
  return useQuery<ScopeChange>({
    queryKey: ["scope-change", id],
    queryFn: () => api.get(`/api/scope-changes/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useSubmitQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      quoteDescription,
      quotePrice,
      quoteCurrency,
    }: {
      id: string;
      quoteDescription: string;
      quotePrice: number;
      quoteCurrency: Currency;
    }) =>
      api
        .patch(`/api/scope-changes/${id}/quote`, {
          quoteDescription,
          quotePrice,
          quoteCurrency,
        })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scope-changes"] }),
  });
}

export function useMarkScopeChangePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/api/scope-changes/${id}/mark-paid`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scope-changes"] }),
  });
}
