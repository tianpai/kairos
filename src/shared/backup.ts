export type BackupExportStage =
  | "starting"
  | "snapshotting"
  | "packaging"
  | "writing"
  | "completed";

export interface BackupExportProgress {
  stage: BackupExportStage;
  percent: number;
  message: string;
}

export interface BackupExportResult {
  success: boolean;
  canceled?: boolean;
  path?: string;
  error?: string;
}

export type BackupImportStage =
  | "starting"
  | "reading"
  | "validating"
  | "restoring"
  | "completed";

export interface BackupImportProgress {
  stage: BackupImportStage;
  percent: number;
  message: string;
}

export interface BackupImportResult {
  success: boolean;
  canceled?: boolean;
  error?: string;
}

export interface BackupManifestFile {
  path: string;
  sizeBytes: number;
  sha256: string;
}

export interface BackupManifest {
  backupFormatVersion: number;
  appVersion: string;
  dbSchemaVersion: number;
  createdAt: string;
  files: Array<BackupManifestFile>;
}
