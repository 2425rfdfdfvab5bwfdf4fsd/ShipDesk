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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleUpload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Maximum file size is 50 MB." });
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const sigResp = await api.get("/api/portal/files/upload-signature", { params: { projectId: id } });
      const sig = sigResp.data as {
        apiKey: string;
        timestamp: number;
        signature: string;
        folder: string;
        uploadPreset: string | null;
        cloudName: string;
      };

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.apiKey);
      formData.append("timestamp", String(sig.timestamp));
      formData.append("signature", sig.signature);
      formData.append("folder", sig.folder);
      if (sig.uploadPreset) {
        formData.append("upload_preset", sig.uploadPreset);
      }

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
      queryClient.invalidateQueries({ queryKey: ["portal-files", id] });
      toast({ title: "File uploaded" });
    } catch (err) {
      toast({ variant: "destructive", title: "Upload failed", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setUploading(false);
      setUploadProgress(null);
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
        onUpload={handleUpload}
        uploading={uploading}
        uploadProgress={uploadProgress ?? undefined}
        onDelete={async (fileId) => {
          try {
            await api.delete(`/api/portal/projects/${id}/files/${fileId}`);
            queryClient.invalidateQueries({ queryKey: ["portal-files", id] });
            toast({ title: "File deleted" });
          } catch {
            toast({ variant: "destructive", title: "Failed to delete file" });
          }
        }}
      />
    </div>
  );
}
