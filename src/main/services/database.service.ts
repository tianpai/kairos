import { PrismaClient } from "@prisma/client";
import log from "electron-log/main";
import { app } from "electron";

let prisma: PrismaClient | null = null;

// Current schema version - increment when adding new migrations
const CURRENT_SCHEMA_VERSION = 2;

// TODO: Before releasing v0.1.0, ensure all users have clean migrations
// and remove this MVP bypass. The version-based migration system will
// properly handle schema updates for real users after v0.1.0.
function isMvpVersion(): boolean {
  const version = app.getVersion();
  const [major, minor] = version.split('.').map(Number);
  return major === 0 && minor < 1;
}

export function getDatabase(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

async function getSchemaVersion(db: PrismaClient): Promise<number> {
  try {
    const result = await db.$queryRaw<Array<{ version: number }>>`
      SELECT version FROM _schema_version LIMIT 1
    `;
    return result[0]?.version ?? 0;
  } catch {
    // Version table doesn't exist, detect schema state
    try {
      await db.$queryRaw`SELECT 1 FROM companies LIMIT 1`;
      // Tables exist, check which columns exist to determine version
      const columns = await db.$queryRaw<Array<{ name: string }>>`
        SELECT name FROM pragma_table_info('job_applications')
      `;
      const columnNames = columns.map((c) => c.name);

      // Detect version based on columns
      if (columnNames.includes('jobUrl')) return 2;
      return 1;
    } catch {
      // Fresh database
      return 0;
    }
  }
}

async function setSchemaVersion(db: PrismaClient, version: number): Promise<void> {
  await db.$executeRaw`
    CREATE TABLE IF NOT EXISTS "_schema_version" (
      "version" INTEGER NOT NULL
    )
  `;
  await db.$executeRaw`DELETE FROM "_schema_version"`;
  await db.$executeRaw`INSERT INTO "_schema_version" (version) VALUES (${version})`;
}

// Migration functions
async function migrateV0toV1(db: PrismaClient): Promise<void> {
  log.info("Running migration v0 -> v1: Initial schema");

  await db.$executeRaw`
    CREATE TABLE IF NOT EXISTS "companies" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL
    )
  `;

  await db.$executeRaw`
    CREATE TABLE IF NOT EXISTS "job_applications" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "companyId" INTEGER NOT NULL,
      "position" TEXT NOT NULL,
      "dueDate" DATETIME NOT NULL,
      "matchPercentage" INTEGER NOT NULL,
      "templateId" TEXT NOT NULL,
      "jobDescription" TEXT,
      "checklist" JSONB,
      "originalResume" TEXT,
      "parsedResume" JSONB,
      "tailoredResume" JSONB,
      "workflowStatus" TEXT,
      "workflowSteps" JSONB,
      "status" TEXT NOT NULL DEFAULT 'active',
      "applicationStatus" TEXT,
      "jobUrl" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "job_applications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `;

  await db.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS "companies_name_key" ON "companies"("name")
  `;
}

async function migrateV1toV2(db: PrismaClient): Promise<void> {
  log.info("Running migration v1 -> v2: Add jobUrl column");
  await db.$executeRaw`ALTER TABLE "job_applications" ADD COLUMN "jobUrl" TEXT`;
}

export async function runMigrations(): Promise<void> {
  const db = getDatabase();

  // During MVP (< 0.1.0), skip version tracking - just ensure tables exist
  if (isMvpVersion()) {
    log.info("MVP version detected, using simple migration");
    try {
      await db.$queryRaw`SELECT 1 FROM companies LIMIT 1`;
      log.info("Database tables already exist");
    } catch {
      log.info("Creating database tables...");
      await migrateV0toV1(db);
      // For MVP, also add any new columns with try/catch
      try {
        await migrateV1toV2(db);
      } catch {
        // Column already exists, ignore
      }
    }
    return;
  }

  // Production migration with version tracking (>= 0.1.0)
  const currentVersion = await getSchemaVersion(db);
  log.info(`Database schema version: ${currentVersion}, target: ${CURRENT_SCHEMA_VERSION}`);

  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    log.info("Database schema is up to date");
    return;
  }

  // Run migrations sequentially
  if (currentVersion < 1) await migrateV0toV1(db);
  if (currentVersion < 2) await migrateV1toV2(db);

  // Update schema version
  await setSchemaVersion(db, CURRENT_SCHEMA_VERSION);
  log.info(`Database migrated to version ${CURRENT_SCHEMA_VERSION}`);
}

export async function connectDatabase(): Promise<void> {
  const db = getDatabase();
  await db.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
