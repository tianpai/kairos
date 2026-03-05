import { eq } from "drizzle-orm";
import { companies } from "../db/schema";
import type * as schema from "../db/schema";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

type Database = BetterSQLite3Database<typeof schema>;

export class CompanyRepository {
  constructor(private readonly db: Database) {}

  getOrCreate(name: string): { id: number; name: string } {
    const existing = this.db
      .select()
      .from(companies)
      .where(eq(companies.name, name))
      .get();

    if (existing) return existing;

    return this.db.insert(companies).values({ name }).returning().get();
  }
}
