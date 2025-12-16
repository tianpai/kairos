import { PrismaClient } from "@prisma/client";
import log from "electron-log/main";

let prisma: PrismaClient | null = null;

export function getDatabase(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function runMigrations(): Promise<void> {
  const db = getDatabase();

  // Check if tables exist by trying to query them
  try {
    await db.$queryRaw`SELECT 1 FROM companies LIMIT 1`;
    log.info("Database tables already exist, skipping migration");
    return;
  } catch {
    log.info("Tables do not exist, running initial migration...");
  }

  // Create tables using raw SQL
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
      "jobDescription" TEXT NOT NULL,
      "checklist" JSONB,
      "originalResume" TEXT NOT NULL,
      "parsedResume" JSONB,
      "tailoredResume" JSONB,
      "workflowStatus" TEXT,
      "workflowSteps" JSONB,
      "status" TEXT NOT NULL DEFAULT 'active',
      "applicationStatus" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "job_applications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `;

  await db.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS "companies_name_key" ON "companies"("name")
  `;

  log.info("Database migration completed successfully");
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
