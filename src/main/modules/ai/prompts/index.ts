import { checklistMatchingPrompt } from "./checklist-matching";
import { checklistParsingPrompt } from "./checklist-parsing";
import { jobInfoExtractingPrompt } from "./jobinfo-extracting";
import { resumeParsingPrompt } from "./resume-parsing";
import { resumeTailoringPrompt } from "./resume-tailoring";

export const prompt = {
  resumeParsing: resumeParsingPrompt,
  checklistParsing: checklistParsingPrompt,
  checklistMatching: checklistMatchingPrompt,
  jobInfoExtracting: jobInfoExtractingPrompt,
  resumeTailoring: resumeTailoringPrompt,
};
