import type { TaskName } from "@type/workflow";

export interface WorkflowDef {
  name: string;
  prerequisites: Map<TaskName, Set<TaskName>>;
}

/**
 * Define a workflow from a plain object.
 * Keys are task names, values are arrays of prerequisite task names.
 *
 * > [!IMPORTANT]
 * > Empty array means entry task (no prerequisites).
 * > Multiple entry tasks can start in async fashion
 */
function defineWorkflow(
  name: string,
  dag: Partial<Record<TaskName, TaskName[]>>,
): WorkflowDef {
  const prerequisites = new Map<TaskName, Set<TaskName>>();
  for (const [task, prereqs] of Object.entries(dag) as [
    TaskName,
    TaskName[],
  ][]) {
    prerequisites.set(task, new Set(prereqs));
  }
  return { name, prerequisites };
}

/**
 * Compose workflows by merging their DAGs.
 * When both define prereqs for the same task, the sets are unioned.
 *
 * > [!NOTE]
 * > Union is commutative. The order of teh Workflow definition does not matter
 */
function compose(name: string, ...workflows: WorkflowDef[]): WorkflowDef {
  const merged = new Map<TaskName, Set<TaskName>>();

  for (const workflow of workflows) {
    for (const [task, prereqs] of workflow.prerequisites) {
      const existing = merged.get(task);
      if (existing) {
        for (const p of prereqs) existing.add(p);
      } else {
        merged.set(task, new Set(prereqs));
      }
    }
  }
  return { name, prerequisites: merged };
}

// Workflow Definitions

const scoring = defineWorkflow("scoring", {
  "checklist.matching": [],
  "score.updating": ["checklist.matching"],
});

const initialAnalysis = compose(
  "initial-analysis",
  scoring,
  defineWorkflow("_initial-analysis-entry", {
    "resume.parsing": [],
    "checklist.parsing": [],
    "jobinfo.extracting": [],
    "checklist.matching": ["resume.parsing", "checklist.parsing"],
  }),
);

const checklistOnly = compose(
  "checklist-only",
  scoring,
  defineWorkflow("_checklist-only-entry", {
    "checklist.parsing": [],
    "jobinfo.extracting": [],
    "checklist.matching": ["checklist.parsing"],
  }),
);

const tailoring = compose(
  "tailoring",
  scoring,
  defineWorkflow("_tailoring-entry", {
    "resume.tailoring": [],
    "checklist.matching": ["resume.tailoring"],
  }),
);

//  Registry

export const workflowRegistry = new Map<string, WorkflowDef>([
  [initialAnalysis.name, initialAnalysis],
  [checklistOnly.name, checklistOnly],
  [tailoring.name, tailoring],
]);
