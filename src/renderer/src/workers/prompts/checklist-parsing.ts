import { z } from 'zod'
import { ChecklistSchema } from '@type/checklist'
import type { Checklist } from '@type/checklist'
import type { AIProvider } from '../../ai/provider.interface'

const checklistJsonSchema = z.toJSONSchema(ChecklistSchema)

export async function parseChecklist(
  provider: AIProvider,
  jobDescription: string,
): Promise<Checklist> {
  const systemPrompt = `You are a job description analyzer. Extract requirements from job postings into a structured checklist.

Categorize requirements into:
- Hard Requirements: Provable, measurable qualifications (technical skills, degrees, years of experience)
- Soft Requirements: Interpersonal and behavioral skills (communication, leadership, problem-solving)
- Preferred Skills: Nice-to-have qualifications (bonus technologies, additional certifications)

For each requirement:
- Extract the full requirement text preserving context
- Identify atomic keywords that can be matched against a resume
- For each keyword, create a KeywordItem object: {keyword: "KeywordName", isFulfilled: false}
- Determine match_type: "all" if ALL keywords must be present, "any" if ANY keyword suffices
- Extract years_required if explicitly mentioned
- Set fulfilled to false (will be updated during matching phase)
- Set reason to empty string "" (will be populated during matching phase if unfulfilled)

Initialize needTailoring as empty array [] (will be populated by user selection).

Return empty arrays if no requirements found in that category.`

  const userPrompt = `Job Description:\n\n${jobDescription}`

  return provider.generateStructuredOutput<Checklist>({
    systemPrompt,
    userPrompt,
    jsonSchema: checklistJsonSchema,
    schemaName: 'checklist_structure',
    model: 'gpt-4o-mini',
  })
}
