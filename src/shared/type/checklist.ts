import { z } from "zod";

export const KeywordItemSchema = z.object({
  keyword: z.string(),
  isFulfilled: z.boolean(),
});

export const ChecklistRequirementSchema = z.object({
  requirement: z.string(),
  keywords: z.array(KeywordItemSchema),
  matchType: z.enum(["all", "any"]),
  yearsRequired: z.number().nullable(),
  fulfilled: z.boolean(),
  reason: z.string(),
});

export const ChecklistSchema = z.object({
  hardRequirements: z.array(ChecklistRequirementSchema),
  softRequirements: z.array(ChecklistRequirementSchema),
  preferredSkills: z.array(ChecklistRequirementSchema),
  needTailoring: z.array(z.string()),
});

export type KeywordItem = z.infer<typeof KeywordItemSchema>;
export type ChecklistRequirement = z.infer<typeof ChecklistRequirementSchema>;
export type Checklist = z.infer<typeof ChecklistSchema>;
