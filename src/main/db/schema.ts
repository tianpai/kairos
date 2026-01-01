import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// Companies table
export const companies = sqliteTable('companies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
})

// Job applications table
export const jobApplications = sqliteTable('job_applications', {
  id: text('id').primaryKey(),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  position: text('position').notNull(),
  dueDate: text('due_date').notNull(),
  matchPercentage: integer('match_percentage').notNull(),
  templateId: text('template_id').notNull(),
  jobDescription: text('job_description'),
  checklist: text('checklist', { mode: 'json' }).$type<Record<string, unknown> | null>(),
  originalResume: text('original_resume'),
  parsedResume: text('parsed_resume', { mode: 'json' }).$type<Record<string, unknown> | null>(),
  tailoredResume: text('tailored_resume', { mode: 'json' }).$type<Record<string, unknown> | null>(),
  workflowStatus: text('workflow_status'),
  workflowSteps: text('workflow_steps', { mode: 'json' }).$type<Record<string, unknown> | null>(),
  status: text('status').notNull().default('active'),
  applicationStatus: text('application_status'),
  jobUrl: text('job_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  jobApplications: many(jobApplications),
}))

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  company: one(companies, {
    fields: [jobApplications.companyId],
    references: [companies.id],
  }),
}))

// Type exports for use in services
export type Company = typeof companies.$inferSelect
export type NewCompany = typeof companies.$inferInsert
export type JobApplication = typeof jobApplications.$inferSelect
export type NewJobApplication = typeof jobApplications.$inferInsert
