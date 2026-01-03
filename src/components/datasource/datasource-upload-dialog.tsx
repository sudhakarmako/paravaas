import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";

interface DatasourceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onUploadComplete?: () => void;
}

export function DatasourceUploadDialog({
  open,
  onOpenChange,
  projectId,
  onUploadComplete,
}: DatasourceUploadDialogProps) {
  const [hasFiles, setHasFiles] = React.useState(false);
  const [hasUploading, setHasUploading] = React.useState(false);
  const [allCompleted, setAllCompleted] = React.useState(false);

  const handleUpload = React.useCallback(
    async (
      file: File,
      onProgress: (progress: number) => void
    ): Promise<void> => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(100);
            resolve();
          } else {
            reject(
              new Error(
                `Upload failed: ${xhr.statusText || `Status ${xhr.status}`}`
              )
            );
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed: Network error"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload cancelled"));
        });

        xhr.open("POST", `/api/projects/${projectId}/datasources`);
        xhr.send(formData);
      });
    },
    [projectId]
  );

  const handleComplete = React.useCallback(() => {
    setAllCompleted(true);
    // Small delay to ensure database write is complete
    setTimeout(() => {
      onUploadComplete?.();
    }, 100);
  }, [onUploadComplete]);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setHasFiles(false);
      setHasUploading(false);
      setAllCompleted(false);
    }
  }, [open]);

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen && (allCompleted || !hasFiles)) {
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    if (allCompleted || !hasFiles) {
      setHasFiles(false);
      setAllCompleted(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        showCloseButton={allCompleted || !hasFiles}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (hasUploading || (!allCompleted && hasFiles)) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Upload CSV Files</DialogTitle>
        </DialogHeader>

        <FileUpload
          accept={{
            "text/csv": [".csv"],
          }}
          multiple={true}
          onUpload={handleUpload}
          onComplete={handleComplete}
          onFilesChange={(hasFiles, hasUploading, allCompleted) => {
            setHasFiles(hasFiles);
            setHasUploading(hasUploading);
            setAllCompleted(allCompleted);
          }}
          onError={(file, error) => {
            console.error("Upload error:", error, file);
          }}
        />

        {allCompleted && hasFiles && (
          <div className="flex justify-end">
            <Button onClick={handleClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
