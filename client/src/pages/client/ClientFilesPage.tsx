import { useParams } from "wouter";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { FileList } from "@/components/files/FileList";
import { useClientFiles } from "@/hooks/useClientPortal";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";

export function ClientFilesPage() {
  const { id } = useParams<{ id: string }>();
  const { data: files, isLoading } = useClientFiles(id);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadQueue, setUploadQueue] = useState<{ current: number; total: number } | undefined>(undefined);
  const [uploadingFileName, setUploadingFileName] = useState<string | undefined>(undefined);

  const uploadSingleFile = async (file: File): Promise<void> => {
    const sigResp = await api.get("/api/portal/files/upload-signature", { params: { projectId: id } });
    const sig = sigResp.data as {
      apiKey: string;
      timestamp: number;
      signature: string;
      folder: string;
      uploadPreset: string | null;
      cloudName: string;
    };

    if (!sig.cloudName || !sig.apiKey) {
      throw new Error("File uploads are not configured. Contact the workspace owner.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", sig.apiKey);
    formData.append("timestamp", String(sig.timestamp));
    formData.append("signature", sig.signature);
    formData.append("folder", sig.folder);
    if (sig.uploadPreset) formData.append("upload_preset", sig.uploadPreset);

    const data = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          let msg = `Upload failed (${xhr.status})`;
          try { msg = JSON.parse(xhr.responseText)?.error?.message || msg; } catch { /* ignore */ }
          reject(new Error(msg));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`);
      xhr.send(formData);
    });

    await api.post(`/api/portal/projects/${id}/files`, {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      cloudinaryPublicId: data.public_id,
      cloudinarySecureUrl: data.secure_url,
    });
  };

  const handleUploadFiles = async (selectedFiles: File[]) => {
    const oversized = selectedFiles.filter((f) => f.size > 50 * 1024 * 1024);
    const valid = selectedFiles.filter((f) => f.size <= 50 * 1024 * 1024);

    if (oversized.length > 0) {
      toast({
        variant: "destructive",
        title: oversized.length === 1 ? "File too large" : `${oversized.length} files too large`,
        description: `Max 50 MB per file. ${oversized.map((f) => f.name).join(", ")} skipped.`,
      });
      if (valid.length === 0) return;
    }

    const total = valid.length;
    let succeeded = 0;
    const failed: string[] = [];

    for (let i = 0; i < total; i++) {
      const file = valid[i];
      setUploadProgress(0);
      setUploadingFileName(file.name);
      setUploadQueue(total > 1 ? { current: i + 1, total } : undefined);
      try {
        await uploadSingleFile(file);
        succeeded++;
      } catch (err) {
        failed.push(file.name);
        toast({
          variant: "destructive",
          title: `Failed to upload ${file.name}`,
          description: err instanceof Error ? err.message : "Please try again.",
        });
      } finally {
        setUploadProgress(null);
      }
    }

    setUploadQueue(undefined);
    setUploadingFileName(undefined);

    queryClient.invalidateQueries({ queryKey: ["portal-files", id] });

    if (succeeded > 0) {
      toast({
        title: total === 1
          ? "File uploaded"
          : `${succeeded} of ${total} file${total > 1 ? "s" : ""} uploaded`,
      });
    }
  };

  return (
    <div>
      <Link
        href={`/projects/${id}`}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-xl font-bold mb-6">Files</h1>
      <FileList
        files={files || []}
        isLoading={isLoading}
        onUpload={handleUploadFiles}
        uploading={uploadProgress !== null}
        uploadProgress={uploadProgress ?? undefined}
        uploadQueue={uploadQueue}
        uploadingFileName={uploadingFileName}
        onDelete={async (fileId) => {
          await api.delete(`/api/portal/projects/${id}/files/${fileId}`);
          queryClient.invalidateQueries({ queryKey: ["portal-files", id] });
          toast({ title: "File deleted" });
        }}
      />
    </div>
  );
}
