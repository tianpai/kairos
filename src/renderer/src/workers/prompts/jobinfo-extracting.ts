import { z } from 'zod'
import type { AIProvider, DeepPartial } from '../../ai/provider.interface'

export const ExtractedJobInfoSchema = z.object({
  company: z.string().describe('Company name extracted from the job description'),
  position: z.string().describe('Job title or position name'),
  dueDate: z
    .string()
    .nullable()
    .describe('Application deadline in YYYY-MM-DD format, or null if not found'),
})

export type ExtractedJobInfo = z.infer<typeof ExtractedJobInfoSchema>

interface ExtractOptions {
  streaming?: boolean
  onPartial?: (partial: DeepPartial<ExtractedJobInfo>) => void
  model: string
}

export async function extractJobInfo(
  provider: AIProvider,
  jobDescription: string,
  options: ExtractOptions,
): Promise<ExtractedJobInfo> {
  const systemPrompt = `You are a job posting analyzer. Extract key information from job descriptions.

Extract the following:
1. Company name: Look for patterns like "at [Company]", "join [Company]", "[Company] is hiring", or company names in headers/titles. If the company name is not clearly stated, use "Unknown Company".

2. Position/Job title: Look for the role title in headers, "Role:", "Position:", "Job Title:" patterns, or the main title of the posting. If not clearly stated, use "Unknown Position".

3. Application deadline: Look for "apply by", "deadline", "closing date", "applications close", or date patterns near such phrases. Return the date in YYYY-MM-DD format. If no deadline is found, return null.

Be conservative - only extract information that is clearly stated. Do not guess or infer beyond what's explicitly mentioned.`

  const userPrompt = `Job Description:\n\n${jobDescription}`

  const params = {
    systemPrompt,
    userPrompt,
    schema: ExtractedJobInfoSchema,
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
