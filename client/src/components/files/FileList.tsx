import { useState, useRef } from "react";
import {
  Upload, Trash2, ExternalLink, Loader2, FolderOpen, Check, X,
  File, FileText, FileImage, FileVideo, FileAudio, FileArchive, FileCode, FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ProjectFile } from "@/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

function getFileTypeIcon(mimeType?: string): React.ElementType {
  if (!mimeType) return File;
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (
    mimeType === "application/zip" ||
    mimeType === "application/x-zip-compressed" ||
    mimeType === "application/gzip" ||
    mimeType === "application/x-tar" ||
    mimeType === "application/x-7z-compressed" ||
    mimeType === "application/x-rar-compressed" ||
    mimeType === "application/vnd.rar"
  ) return FileArchive;
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "text/csv"
  ) return FileSpreadsheet;
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/rtf"
  ) return FileText;
  if (
    mimeType === "application/json" ||
    mimeType === "application/javascript" ||
    mimeType === "application/typescript"
  ) return FileCode;
  return File;
}

interface FileListProps {
  files: ProjectFile[];
  onUpload?: (files: File[]) => void;
  onDelete?: (fileId: string) => Promise<void> | void;
  uploading?: boolean;
  uploadProgress?: number;
  uploadQueue?: { current: number; total: number };
  uploadingFileName?: string;
  isLoading?: boolean;
  canUpload?: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function FileList({
  files,
  onUpload,
  onDelete,
  uploading,
  uploadProgress,
  uploadQueue,
  uploadingFileName,
  isLoading,
  canUpload = true,
}: FileListProps) {
  const [dragOver, setDragOver] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (rawFiles: FileList | null) => {
    if (!rawFiles || !onUpload || uploading) return;
    const valid = Array.from(rawFiles).filter((f) => f.size <= MAX_FILE_SIZE);
    const oversized = Array.from(rawFiles).filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0 && valid.length === 0) return; // parent handles size toast
    if (valid.length > 0) onUpload(valid);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleConfirmDelete = async (fileId: string) => {
    if (!onDelete) return;
    setDeletingId(fileId);
    try {
      await onDelete(fileId);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const queueLabel = uploadQueue && uploadQueue.total > 1
    ? `File ${uploadQueue.current} of ${uploadQueue.total}`
    : uploadingFileName
    ? uploadingFileName
    : null;

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

          {uploading ? (
            <>
              {queueLabel && (
                <p className="text-[11px] font-medium text-muted-foreground mb-1">{queueLabel}</p>
              )}
              <p className="text-xs text-muted-foreground mb-2">Uploading…</p>
              {uploadProgress !== undefined && uploadProgress !== null && (
                <div className="w-full max-w-[180px] mx-auto mt-1 mb-1.5 space-y-1">
                  <Progress value={uploadProgress} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground text-center">{uploadProgress}%</p>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-2">Drag & drop files, or</p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                data-testid="button-browse-files"
              >
                Browse files
              </Button>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Max 50 MB per file · Multiple files supported
              </p>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
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
              Upload files to share documents and assets with your client.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {files.map((file) => {
            const Icon = getFileTypeIcon(file.mimeType);
            const isConfirming = confirmDeleteId === file.id;
            const isDeleting = deletingId === file.id;
            return (
              <div
                key={file.id}
                className={cn(
                  "border rounded-lg px-3 py-2.5 flex items-center gap-2.5 bg-card transition-colors",
                  isConfirming && "border-destructive/40 bg-destructive/5"
                )}
                data-testid={`file-row-${file.id}`}
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" data-testid={`text-filename-${file.id}`}>
                    {file.fileName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatBytes(file.fileSize)} · {file.uploaderName} · {formatDate(file.createdAt)}
                  </p>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  {!isConfirming && (
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
                  )}
                  {onDelete && !isConfirming && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirmDeleteId(file.id)}
                      title="Delete file"
                      data-testid={`button-delete-file-${file.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {isConfirming && (
                    <>
                      <span className="text-[10px] text-destructive font-medium self-center mr-1 whitespace-nowrap">
                        Delete?
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleConfirmDelete(file.id)}
                        disabled={isDeleting}
                        title="Confirm delete"
                        data-testid={`button-confirm-delete-${file.id}`}
                      >
                        {isDeleting
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Check className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isDeleting}
                        title="Cancel"
                        data-testid={`button-cancel-delete-${file.id}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
