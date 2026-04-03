// TODO: move schema-builder to shared/ to fix cross-boundary import (main ← renderer)
import { buildResumeZodSchema } from "../../../../renderer/src/templates/schema-builder";

export function resumeParsingPrompt(
  rawResumeContent: string,
  templateId: string,
) {
  return {
    systemPrompt:
      "Extract structured data from resumes. Only include factual information from the source.",
    userPrompt: `Resume: ${rawResumeContent}`,
    schema: buildResumeZodSchema(templateId),
  };
}
