import * as React from "react";
import { useDropzone } from "react-dropzone";
import {
  FileIcon,
  XIcon,
  UploadIcon,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheetIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/core/lib/utils";
import type { UploadFile, FileAcceptConfig } from "@/core/types/datasources";

interface FileUploadProps {
  accept: FileAcceptConfig;
  multiple?: boolean;
  onUpload: (
    file: File,
    onProgress: (progress: number) => void
  ) => Promise<void>;
  onComplete?: () => void;
  onError?: (file: File, error: Error) => void;
  onFilesChange?: (
    hasFiles: boolean,
    hasUploading: boolean,
    allCompleted: boolean
  ) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

function getFileIcon(fileType: string, fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  if (
    fileType.includes("csv") ||
    fileType.includes("spreadsheet") ||
    extension === "csv"
  ) {
    return FileSpreadsheetIcon;
  }

  return FileIcon;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function FileUpload({
  accept,
  multiple = true,
  onUpload,
  onComplete,
  onError,
  onFilesChange,
  maxFiles,
  disabled = false,
  className,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<UploadFile[]>([]);

  const uploadFile = React.useCallback(
    async (fileItem: UploadFile) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: "uploading" as const } : f
        )
      );

      try {
        await onUpload(fileItem.file, (progress) => {
          setFiles((prev) =>
            prev.map((f) => (f.id === fileItem.id ? { ...f, progress } : f))
          );
        });

        setFiles((prev) => {
          const updated = prev.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: "completed" as const, progress: 100 }
              : f
          );

          const allCompleted = updated.every(
            (f) => f.status === "completed" || f.status === "error"
          );
          if (allCompleted && updated.length > 0) {
            onComplete?.();
          }

          return updated;
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Upload failed");
        setFiles((prev) => {
          const updated = prev.map((f) =>
            f.id === fileItem.id
              ? {
                  ...f,
                  status: "error" as const,
                  error: err.message,
                }
              : f
          );

          const allCompleted = updated.every(
            (f) => f.status === "completed" || f.status === "error"
          );
          if (allCompleted && updated.length > 0) {
            onComplete?.();
          }

          return updated;
        });
        onError?.(fileItem.file, err);
      }
    },
    [onUpload, onComplete, onError]
  );

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (disabled) return;

      const newFiles: UploadFile[] = acceptedFiles
        .slice(0, maxFiles ? maxFiles - files.length : acceptedFiles.length)
        .map((file) => ({
          id: `${Date.now()}-${Math.random()}`,
          file,
          progress: 0,
          status: "pending" as const,
          fileType: file.type || "application/octet-stream",
        }));

      setFiles((prev) => {
        const updated = [...prev, ...newFiles];
        return maxFiles ? updated.slice(0, maxFiles) : updated;
      });

      // Auto-start upload for new files
      newFiles.forEach((fileItem) => {
        uploadFile(fileItem);
      });
    },
    [disabled, maxFiles, files.length, uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    disabled,
    noClick: disabled,
  });

  // Notify parent of file state changes
  React.useEffect(() => {
    const hasFiles = files.length > 0;
    const hasUploading = files.some((f) => f.status === "uploading");
    const allCompleted =
      files.length > 0 &&
      files.every((f) => f.status === "completed" || f.status === "error");
    onFilesChange?.(hasFiles, hasUploading, allCompleted);
  }, [files, onFilesChange]);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      const remaining = updated.filter(
        (f) => f.status === "completed" || f.status === "error"
      );
      if (remaining.length === updated.length && updated.length > 0) {
        onComplete?.();
      }
      return updated;
    });
  };

  const hasUploading = files.some((f) => f.status === "uploading");
  const completedCount = files.filter((f) => f.status === "completed").length;

  return (
    <div className={cn("space-y-3", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:border-muted-foreground/50"
        )}
      >
        <input {...getInputProps()} />
        <UploadIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Drag and drop files here, or click to select
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {completedCount} of {files.length} uploaded
            </span>
            {hasUploading && <Spinner className="h-3 w-3" />}
          </div>

          <div className="space-y-2">
            {files.map((fileItem) => {
              const FileIconComponent = getFileIcon(
                fileItem.fileType || "",
                fileItem.file.name
              );

              return (
                <div
                  key={fileItem.id}
                  className="border rounded-lg p-3 space-y-2 relative group"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative shrink-0">
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                        <FileIconComponent className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {fileItem.status === "uploading" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
                          <Spinner className="h-3 w-3" />
                        </div>
                      )}
                      {fileItem.status === "completed" && (
                        <div className="absolute -top-0.5 -right-0.5 bg-green-600 rounded-full p-0.5">
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                      )}
                      {fileItem.status === "error" && (
                        <div className="absolute -top-0.5 -right-0.5 bg-destructive rounded-full p-0.5">
                          <AlertCircle className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {fileItem.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                    </div>
                    {(fileItem.status === "pending" ||
                      fileItem.status === "error") && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeFile(fileItem.id)}
                        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      {fileItem.status === "uploading" && (
                        <>
                          <span className="text-muted-foreground">
                            Uploading...
                          </span>
                          <span className="text-muted-foreground font-medium">
                            {fileItem.progress}%
                          </span>
                        </>
                      )}
                      {fileItem.status === "completed" && (
                        <>
                          <span className="text-green-600 font-medium">
                            Uploaded
                          </span>
                          <span className="text-green-600 font-medium">
                            100%
                          </span>
                        </>
                      )}
                      {fileItem.status === "pending" && (
                        <>
                          <span className="text-muted-foreground">Pending</span>
                          <span className="text-muted-foreground">0%</span>
                        </>
                      )}
                      {fileItem.status === "error" && (
                        <span className="text-destructive text-xs">
                          {fileItem.error || "Upload failed"}
                        </span>
                      )}
                    </div>
                    <Progress
                      value={fileItem.progress}
                      variant={
                        fileItem.status === "completed"
                          ? "success"
                          : fileItem.status === "error"
                            ? "error"
                            : "default"
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
