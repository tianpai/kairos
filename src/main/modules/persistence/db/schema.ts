import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Companies table
export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

// Jobs table (metadata only)
export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  position: text("position").notNull(),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("active"),
  applicationStatus: text("application_status"),
  jobUrl: text("job_url"),
  archived: integer("archived").notNull().default(0),
  statusUpdatedAt: text("status_updated_at"),
  interviewDate: text("interview_date"),
  pinned: integer("pinned").notNull().default(0),
  pinnedAt: text("pinned_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Resume content table
export const resumes = sqliteTable("resumes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" })
    .unique(),
  templateId: text("template_id").notNull(),
  originalResume: text("original_resume").notNull(),
  parsedResume: text("parsed_resume", { mode: "json" }).$type<Record<
    string,
    unknown
  > | null>(),
  tailoredResume: text("tailored_resume", { mode: "json" }).$type<Record<
    string,
    unknown
  > | null>(),
});

// Checklist table
export const checklists = sqliteTable("checklists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" })
    .unique(),
  jobDescription: text("job_description"),
  checklist: text("checklist", { mode: "json" }).$type<Record<
    string,
    unknown
  > | null>(),
});

// Score table
export const scores = sqliteTable("scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" })
    .unique(),
  matchPercentage: integer("match_percentage").notNull(),
});

// Workflow state table
export const workflows = sqliteTable("workflows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" })
    .unique(),
  state: text("state", { mode: "json" }).$type<Record<string, unknown> | null>(),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  jobs: many(jobs),
}));

export const jobsRelations = relations(
  jobs,
  ({ one }) => ({
    company: one(companies, {
      fields: [jobs.companyId],
      references: [companies.id],
    }),
    resume: one(resumes, {
      fields: [jobs.id],
      references: [resumes.jobId],
    }),
    checklist: one(checklists, {
      fields: [jobs.id],
      references: [checklists.jobId],
    }),
    score: one(scores, {
      fields: [jobs.id],
      references: [scores.jobId],
    }),
    workflow: one(workflows, {
      fields: [jobs.id],
      references: [workflows.jobId],
    }),
  }),
);

export const resumesRelations = relations(resumes, ({ one }) => ({
  job: one(jobs, {
    fields: [resumes.jobId],
    references: [jobs.id],
  }),
}));

export const checklistsRelations = relations(checklists, ({ one }) => ({
  job: one(jobs, {
    fields: [checklists.jobId],
    references: [jobs.id],
  }),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
  job: one(jobs, {
    fields: [scores.jobId],
    references: [jobs.id],
  }),
}));

export const workflowsRelations = relations(workflows, ({ one }) => ({
  job: one(jobs, {
    fields: [workflows.jobId],
    references: [jobs.id],
  }),
}));

// Type exports for use in services
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;
export type Checklist = typeof checklists.$inferSelect;
export type NewChecklist = typeof checklists.$inferInsert;
export type Score = typeof scores.$inferSelect;
export type NewScore = typeof scores.$inferInsert;
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
