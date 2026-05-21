import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ProjectFile } from "../types";

export function useFiles(projectId: string) {
  return useQuery<ProjectFile[]>({
    queryKey: ["files", projectId],
    queryFn: () =>
      api.get(`/api/projects/${projectId}/files`).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useUploadSignature(projectId: string) {
  return useQuery<{
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
    uploadPreset: string;
  }>({
    queryKey: ["upload-signature", projectId],
    queryFn: () =>
      api
        .get("/api/files/upload-signature", { params: { projectId } })
        .then((r) => r.data),
    enabled: !!projectId,
    staleTime: 50000,
  });
}

export function useCreateFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      ...data
    }: {
      projectId: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      cloudinaryPublicId: string;
      cloudinarySecureUrl: string;
    }) =>
      api.post(`/api/projects/${projectId}/files`, data).then((r) => r.data),
    onSuccess: (_data, { projectId }) =>
      qc.invalidateQueries({ queryKey: ["files", projectId] }),
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      fileId,
    }: {
      projectId: string;
      fileId: string;
    }) =>
      api
        .delete(`/api/projects/${projectId}/files/${fileId}`)
        .then((r) => r.data),
    onSuccess: (_data, { projectId }) =>
      qc.invalidateQueries({ queryKey: ["files", projectId] }),
  });
}
