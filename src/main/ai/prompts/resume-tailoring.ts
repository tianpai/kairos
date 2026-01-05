import { buildTailoringZodSchema } from '@templates/schema-builder'
import type { Checklist } from '@type/checklist'
import type { AIProvider, DeepPartial } from '../provider.interface'

interface TailorOptions {
  streaming?: boolean
  onPartial?: (partial: DeepPartial<Record<string, unknown>>) => void
  model: string
}

export async function tailorResume(
  provider: AIProvider,
  checklist: Checklist,
  resumeStructure: Record<string, unknown>,
  templateId: string,
  options: TailorOptions,
): Promise<Record<string, unknown>> {
  const systemPrompt = `You are an expert resume writer and career coach. Your task is to tailor a resume to incorporate specific keywords selected by the user.

The checklist includes a "needTailoring" array containing keywords the user wants to add/emphasize in their resume. The application trusts the user's judgment that they possess these skills.

For EACH keyword in needTailoring:

SKILLS SECTION (MANDATORY):
- ALWAYS ADD the keyword to the skills section if not already present
- Make it prominent and well-placed among other skills
- Group similar technologies together logically
- This is REQUIRED for every keyword in needTailoring - NO EXCEPTIONS

SUMMARY SECTION (HIGH PRIORITY):
- If a summary exists, tailor it to emphasize relevant experience for this specific job
- Incorporate high-priority keywords from needTailoring naturally into the summary
- Keep it concise (2-3 sentences maximum)
- Highlight the candidate's strongest relevant qualifications
- Make it compelling and job-specific
- IMPORTANT: Use the summary as the primary place for keywords that are HARD to fit into work experiences, such as:
  * Soft skills (e.g., "strong communication", "team leadership", "problem-solving")
  * Availability/preferences (e.g., "willing to travel", "open to relocation", "flexible schedule")
  * Personal attributes (e.g., "quick learner", "detail-oriented", "self-motivated")
  * Certifications or qualifications that don't have dedicated sections
- If no summary exists and there are soft skills or attributes in needTailoring, CREATE a brief professional summary

BULLET POINTS & EXPERIENCES (OPTIONAL):
1. Find the requirement in the checklist that contains this keyword (provides context about how it's used)
2. Identify existing experiences/bullet points that are RELATED or RELEVANT to this keyword
3. IF you find relevant experiences, tailor those bullet points to naturally incorporate the keyword
4. IF you CANNOT find any relevant experiences, SKIP bullet point tailoring for this keyword
5. Use intelligent judgment - only add to experiences where it makes contextual sense

Examples of good bullet point tailoring:
- "deployed applications to cloud" → "deployed applications to AWS" (if AWS in needTailoring)
- "built web applications" → "built web applications using React" (if React in needTailoring)
- "managed databases" → "managed PostgreSQL databases" (if PostgreSQL in needTailoring)

DO NOT force keywords into completely unrelated experiences. It's better to skip bullet point tailoring than to make it sound unnatural.

Additional optimization:
1. REORDER content to prioritize experiences that use needTailoring keywords
2. QUANTIFY achievements where possible (if data exists)
3. Make the keyword usage feel natural, not keyword-stuffed

Return the complete resume with needTailoring cleared (empty array []).`

  const userPrompt = `Job Requirements Analysis (from matching):
${JSON.stringify(checklist, null, 2)}

Current Resume:
${JSON.stringify(resumeStructure, null, 2)}

Tailor this resume to maximize fit for the job requirements. Remember: maintain complete honesty and the exact JSON schema structure.`

  // Build Zod schema filtered by existing sections (prevents empty sections)
  const schema = buildTailoringZodSchema(templateId, resumeStructure)

  const params = {
    systemPrompt,
    userPrompt,
    schema,
    model: options.model,
  }

  if (options.streaming && options.onPartial) {
    return provider.streamStructuredOutput({
      ...params,
      onPartial: options.onPartial,
    })
  }

  return provider.generateStructuredOutput(params)
}
