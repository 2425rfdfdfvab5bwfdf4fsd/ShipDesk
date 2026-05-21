import { useState, useRef } from "react";
import { Upload, Trash2, FileIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectFile } from "@/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface FileListProps {
  files: ProjectFile[];
  onUpload?: (file: File) => void;
  onDelete?: (fileId: string) => void;
  uploading?: boolean;
  canUpload?: boolean;
}

export function FileList({ files, onUpload, onDelete, uploading, canUpload = true }: FileListProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onUpload) onUpload(file);
  };

  return (
    <div className="space-y-4">
      {canUpload && onUpload && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-2">Drag and drop a file here, or</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Browse files"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">Max 50 MB</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onUpload) onUpload(file);
            }}
          />
        </div>
      )}

      {files.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No files yet.</div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="border rounded-lg p-3 flex items-center gap-3 bg-card">
              <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.fileSize)} · {file.uploaderName} · {formatDate(file.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href={file.cloudinarySecureUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(file.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
