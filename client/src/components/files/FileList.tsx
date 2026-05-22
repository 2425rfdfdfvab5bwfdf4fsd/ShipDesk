import { useState, useRef } from "react";
import { Upload, Trash2, FileIcon, ExternalLink, Loader2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectFile } from "@/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface FileListProps {
  files: ProjectFile[];
  onUpload?: (file: File) => void;
  onDelete?: (fileId: string) => void;
  uploading?: boolean;
  isLoading?: boolean;
  canUpload?: boolean;
}

export function FileList({ files, onUpload, onDelete, uploading, isLoading, canUpload = true }: FileListProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file && onUpload) onUpload(file);
  };

  return (
    <div className="space-y-3">
      {canUpload && onUpload && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-5 text-center transition-colors",
            uploading
              ? "border-muted-foreground/20 bg-muted/30 cursor-not-allowed"
              : dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 cursor-pointer"
          )}
          onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => { if (!uploading) fileInputRef.current?.click(); }}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 mx-auto text-muted-foreground mb-2 animate-spin" />
          ) : (
            <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
          )}
          <p className="text-xs text-muted-foreground mb-2">
            {uploading ? "Uploading…" : "Drag & drop, or"}
          </p>
          {!uploading && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              data-testid="button-browse-files"
            >
              Browse files
            </Button>
          )}
          <p className="text-[10px] text-muted-foreground mt-1.5">Max 50 MB</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onUpload) onUpload(file);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-1.5">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 sm:py-14 text-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No files yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Upload a file to share documents and assets with your client.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {files.map((file) => (
            <div
              key={file.id}
              className="border rounded-lg px-3 py-2.5 flex items-center gap-2.5 bg-card"
              data-testid={`file-row-${file.id}`}
            >
              <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" data-testid={`text-filename-${file.id}`}>
                  {file.fileName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatBytes(file.fileSize)} · {file.uploaderName} · {formatDate(file.createdAt)}
                </p>
              </div>
              <div className="flex gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Open file"
                  data-testid={`button-open-file-${file.id}`}
                  asChild
                >
                  <a href={file.cloudinarySecureUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(file.id)}
                    title="Delete file"
                    data-testid={`button-delete-file-${file.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
