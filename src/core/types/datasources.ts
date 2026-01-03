export interface Datasource {
  id: number;
  projectId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: number;
  status: "pending" | "inprogress" | "completed" | "failed";
  duckdbTableName: string | null;
}

export interface DatasourcesResponse {
  datasources: Datasource[];
}

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  thumbnailUrl?: string;
  fileType?: string;
}

export type FileAcceptConfig = Record<string, string[]>;
