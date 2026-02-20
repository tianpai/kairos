export interface BackupExportResult {
  success: boolean;
  canceled?: boolean;
  path?: string;
  error?: string;
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
