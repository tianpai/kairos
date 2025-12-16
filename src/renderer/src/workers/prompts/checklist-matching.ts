import { z } from 'zod'
import { ChecklistSchema } from '@type/checklist'
import type { Checklist } from '@type/checklist'
import type { AIProvider } from '../../ai/provider.interface'

const checklistJsonSchema = z.toJSONSchema(ChecklistSchema)

export async function matchChecklist(
  provider: AIProvider,
  checklist: Checklist,
  resumeStructure: Record<string, unknown>,
): Promise<Checklist> {
  const systemPrompt = `You are a resume-to-job matching expert. Your task is to accurately determine which job requirements are fulfilled by the candidate's resume.

For each requirement:
1. For EACH individual keyword in the keywords array:
   - Check if it appears in the resume (case-insensitive, allow variations like "JavaScript"/"JS", "React"/"React.js")
   - Set isFulfilled=true for that specific keyword if found, false otherwise
2. After checking all keywords, determine if the overall requirement is fulfilled:
   - match_type "all": requirement fulfilled ONLY if ALL keywords have isFulfilled=true
   - match_type "any": requirement fulfilled if AT LEAST ONE keyword has isFulfilled=true
3. For requirements with years_required, also verify sufficient years of experience
4. Set requirement fulfilled=true ONLY if the requirement is clearly met based on match_type logic
5. Be strict but fair - don't mark as fulfilled if evidence is weak or ambiguous
6. For the reason field:
   - If fulfilled=true: set reason to empty string ""
   - If fulfilled=false: provide a brief explanation of what is missing or why it's not fulfilled
   - Focus on specific gaps, contradictions, or missing information
   - Examples: "Systems integration is evidenced but reporting tools are not clearly mentioned or detailed."
              "No mention of willingness or ability to travel is provided."
              "Resume mentions graduation from Computer Science, but currently enrolled in a general Business Information Technology without specific confirmation of a major in Computer Engineering or a directly related field."

Keep needTailoring as empty array [] (will be populated by user in frontend).

Return the complete checklist with updated keyword-level and requirement-level fulfilled status.`

  const userPrompt = `Job Requirements Checklist:
${JSON.stringify(checklist, null, 2)}

Candidate Resume:
${JSON.stringify(resumeStructure, null, 2)}

Analyze the resume against each requirement and return the updated checklist with fulfilled status.`

  return provider.generateStructuredOutput<Checklist>({
    systemPrompt,
    userPrompt,
    jsonSchema: checklistJsonSchema,
    schemaName: 'checklist_matching',
    model: 'gpt-4o',
  })
}
