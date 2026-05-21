import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Invoice, Currency } from "../types";

export function useInvoices(projectId?: string, status?: string) {
  return useQuery<{ invoices: Invoice[]; total: number }>({
    queryKey: ["invoices", projectId, status],
    queryFn: () =>
      api
        .get("/api/invoices", { params: { projectId, status, limit: 50 } })
        .then((r) => r.data),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      projectId: string;
      title: string;
      description?: string;
      amount: number;
      currency: Currency;
      dueDate?: string;
    }) => api.post("/api/invoices", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });
}

export function useMarkInvoicePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/api/invoices/${id}/mark-paid`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/invoices/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });
}
