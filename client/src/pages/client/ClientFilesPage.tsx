import { useParams } from "wouter";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { FileList } from "@/components/files/FileList";
import { useClientFiles } from "@/hooks/useClientPortal";
import { useCreateFile, useDeleteFile } from "@/hooks/useFiles";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export function ClientFilesPage() {
  const { id } = useParams<{ id: string }>();
  const { data: files } = useClientFiles(id);
  const createFile = useCreateFile();
  const deleteFile = useDeleteFile();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Max 50 MB" });
      return;
    }
    setUploading(true);
    try {
      const sigResp = await api.get("/api/portal/files/upload-signature", { params: { projectId: id } });
      const sig = sigResp.data as { apiKey: string; timestamp: number; signature: string; folder: string; uploadPreset: string; cloudName: string };
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sig.apiKey);
      formData.append("timestamp", String(sig.timestamp));
      formData.append("signature", sig.signature);
      formData.append("folder", sig.folder);
      formData.append("upload_preset", sig.uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/raw/upload`, { method: "POST", body: formData });
      const data = await res.json() as { secure_url: string; public_id: string };
      await api.post(`/api/portal/projects/${id}/files`, {
        fileName: file.name, fileSize: file.size, mimeType: file.type,
        cloudinaryPublicId: data.public_id, cloudinarySecureUrl: data.secure_url,
      });
      toast({ title: "File uploaded" });
    } catch {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploading(false);
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
        onUpload={handleUpload}
        uploading={uploading}
        onDelete={async (fileId) => {
          try {
            await api.delete(`/api/portal/projects/${id}/files/${fileId}`);
            toast({ title: "File deleted" });
          } catch {
            toast({ variant: "destructive", title: "Failed to delete file" });
          }
        }}
      />
    </div>
  );
}
