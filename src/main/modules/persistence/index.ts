import type * as schema from "./db/schema";

export {
  LegacyUpgradeRequiredError,
  V1_LEGACY,
  V2_SPLIT,
  V4_COMPANY_INLINE,
  V5_CLEAN,
  connectDatabase,
  disconnectDatabase,
  getDatabase,
  getSqlite,
  getTargetSchemaVersion,
  runMigrations,
  supportsLegacyBackupImport,
} from "./db/database.service";
export {
  ensureBackupImportNotInProgress,
  exportResumeDataBackup,
  importResumeDataBackup,
  isBackupImportInProgress,
} from "./backup/backup-archive.service";
export * from "./db/schema";
export type PersistenceSchema = typeof schema;

export {
  JobRepository,
  ResumeRepository,
  ChecklistRepository,
  ScoreRepository,
  WorkflowRepository,
} from "./repositories/repo";
