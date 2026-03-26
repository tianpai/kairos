# Workflow Module Design

## Overview

A workflow is a DAG of tasks. Tasks are self-contained units that read/write DB
independently. The workflow engine manages execution order and state persistence.

**Tasks cannot run independently.** Everything executes through the workflow
engine. A workflow can be as small as a single task — this is the smallest unit
of execution. This gives the engine uniform control over state and cancellation.

## Core Interfaces

```ts
// ── Task ────────────────────────────────────────────────────────────────

interface TaskError {
  message: string
  retryable: boolean
}

abstract class BaseTask {
  abstract readonly name: TaskName
  abstract run(jobId: string): Promise<TaskError | null>
  protected emit(jobId: string, partial: unknown): void
}

// ── Workflow ────────────────────────────────────────────────────────────

// A workflow is just data — a named DAG. No methods.
interface WorkflowDef {
  name: string
  prerequisites: Map<TaskName, Set<TaskName>>
}

// ── State ───────────────────────────────────────────────────────────────

// DB column: null = clean, ready to start. Non-null = running or has failures.
// On workflow success → clear to null.

interface TaskState {
  status: "pending" | "running" | "completed" | "failed"
  error?: TaskError   // only when status === "failed"
}

interface WfState {
  workflowName: string                    // needed for retry (to look up the DAG)
  tasks: Record<TaskName, TaskState>
}

// Workflow-level status is derived, never stored:
//   all completed → "completed"
//   any running   → "running"
//   any failed    → "failed"
//   all pending   → "idle"

// ── Engine ──────────────────────────────────────────────────────────────

class WfEngine {
  private activeJobs: Set<string>   // tracks in-flight workflows (not state)

  constructor(
    workflowRepo: WorkflowRepository,
    tasks: Map<TaskName, BaseTask>,
    workflows: Map<string, WorkflowDef>,
  )

  // public
  start(jobId: string, workflowName: string): Promise<void>
  retry(jobId: string): Promise<void>
  getState(jobId: string): WfState | null   // lazy stale recovery here

  // private — DAG resolution
  private getEntryTasks(workflow: WorkflowDef): TaskName[]
  private getReadyTasks(workflow: WorkflowDef, tasks: Record<TaskName, TaskState>): TaskName[]

  // private — execution
  private executeTask(jobId, taskName, workflow): Promise<void>
  private startReadyTasks(jobId, workflow): void

  // private — state
  private readState(jobId): WfState | null
  private writeState(jobId, state: WfState | null): void
  private updateTaskState(jobId, taskName, taskState): void
  private failTask(jobId, taskName, error): void

  // private — events
  private emitStateChanged(jobId, state: WfState | null): void
}
```

## Key Rules

1. Tasks own and resolve their own deps — engine injects nothing
2. Tasks read/write DB directly — no inter-task payload passing
3. All workflow state lives in DB — no in-memory store
4. One workflow per job (enforced at UI and backend)
5. Job creation is outside the workflow — just CRUD before `start()`
6. No standalone task execution — everything goes through WorkflowEngine
7. Streaming is always on — tasks use `this.emit()` from BaseTask
8. AI client is a singleton — `initAIClient()` at startup, `getAIClient()` in tasks

## Workflow State Rules

- **null in DB** → clean slate, ready to start a new workflow
- **non-null in DB** → workflow is running or has failures needing attention
- **on success** → engine clears state to null (job is done)
- **on failure** → state persists with per-task errors, user can retry or discard

## activeJobs (in-memory tracking)

Engine tracks which jobs have workflows actively running via `Set<string>`.
This is NOT state duplication — it's a runtime flag for the current engine instance.

- `start()` / `retry()` → `activeJobs.add(jobId)`
- workflow completes (all tasks done) → `activeJobs.delete(jobId)`, clear state to null
- workflow stuck (failures, no progress) → `activeJobs.delete(jobId)`, state stays in DB
- `getState()` checks `activeJobs` to distinguish live "running" from stale "running"

## Stale Recovery

Lazy — runs inside `getState()`, not on app startup.

If `getState(jobId)` finds tasks with status `"running"` and jobId is NOT in
`activeJobs`, those tasks are stale (app crashed mid-workflow). Engine marks
them as `"failed"` with `{ message: "Workflow was interrupted", retryable: true }`,
persists, and emits. User sees the failure and can retry.

If jobId IS in `activeJobs`, the "running" status is legitimate — skip recovery.

## Retry Behavior

Retry always continues from where it failed:

1. Read state from DB (has `workflowName` + per-task statuses)
2. Look up the workflow DAG by `workflowName`
3. Reset `failed` tasks to `pending`
4. `completed` tasks stay completed (never re-run)
5. `getReadyTasks()` finds pending tasks whose prereqs are all completed
6. DAG naturally picks up where it left off

No trimming, no custom starting points. The state encodes where to resume.

## Task Architecture

```
BaseTask (abstract)
├── owns: event system coupling (this.emit)
├── contract: run(jobId) → TaskError | null
│
├── ResumeParsingTask      — imports resumeRepo, aiClient
├── ChecklistParsingTask   — imports checklistRepo, aiClient
├── ChecklistMatchingTask  — imports checklistRepo, resumeRepo, aiClient
├── JobInfoExtractingTask  — imports jobRepo, checklistRepo, aiClient
├── ResumeTailoringTask    — imports resumeRepo, checklistRepo, aiClient
└── ScoreUpdatingTask      — imports checklistRepo, scoreRepo (no AI, no emit)
```

Tasks resolve their own deps via imports:
- `getDatabase()` singleton for repo construction
- `getAIClient()` singleton for AI calls

## Error Handling

```ts
interface TaskError {
  message: string      // "AI provider timed out", "Failed to save results"
  retryable: boolean   // true = retry button prominent, false = gray it out
}
```

- Engine cannot fix errors — it only persists them and notifies the renderer
- Engine may auto-retry internally for transient errors (e.g. network timeout)
  User only sees the error after all auto-retry attempts are exhausted
- Error is persisted per-task in workflow state — renderer shows error next to the failed step
- User actions: retry or remove the workflow

## Workflow Composition

Workflows are composable. A workflow is a DAG, which can be one node or many.
Larger workflows are built by merging smaller workflow DAGs and adding bridge
edges (prerequisites that connect them).

### Building block: scoring

```
checklist.matching → score.updating
```

This is the common tail shared by all current workflows.

### Composed workflows

**initial-analysis** (was create-application)
```
resume.parsing ─────────┐
checklist.parsing ──────┤→ [scoring]
jobinfo.extracting      │
```

**checklist-only**
```
checklist.parsing ───────┤→ [scoring]
jobinfo.extracting       │
```

**tailoring**
```
resume.tailoring → [scoring]
```

### Composition mechanics

A workflow is `Map<TaskName, Set<TaskName>>`. Composing = merging the maps.
When both sides define prereqs for the same task, union the sets. Order
does not matter — union is commutative.

```ts
const scoring = defineWorkflow("scoring", {
  "checklist.matching": [],
  "score.updating": ["checklist.matching"],
})

const initialAnalysis = compose("initial-analysis", scoring,
  defineWorkflow("_entry", {
    "resume.parsing": [],
    "checklist.parsing": [],
    "jobinfo.extracting": [],
    "checklist.matching": ["resume.parsing", "checklist.parsing"],
  }),
)
```

`compose` merges `checklist.matching`'s prereqs: `[] ∪ [resume.parsing,
checklist.parsing]`.

## Job Creation Flow

```
Renderer                          Main
   |                               |
   |-- ipc: "job:create" --------->|  create job row with placeholders
   |<-- returns jobId -------------|
   |                               |
   |-- ipc: "workflow:start" ----->|  start(jobId, "initial-analysis")
```

Job creation is a CRUD operation. Workflow execution is a separate concern.
The renderer orchestrates: create job first, then start workflow with the jobId.

## Event System

Two events, simple payloads:

```ts
// State change — full state push every time. null = workflow cleared.
interface WorkflowPushState {
  jobId: string
  state: WfState | null
}

// Streaming — partial AI results during task execution
interface WorkflowAiPartial {
  jobId: string
  taskName: TaskName
  partial: unknown
}
```

Renderer receives full state on every change. No discriminated union,
no separate events for taskCompleted/taskFailed/workflowCompleted.
Renderer diffs if it needs to know what changed.

## Streaming

Streaming is always on. No flags, no options.

- BaseTask provides `this.emit(jobId, partial)` — event coupling in one place
- AI tasks call `this.emit()` during AI execution
- Non-AI tasks (e.g. `score.updating`) simply never call it
- Engine knows nothing about streaming

## Cancellation (skip this - do not implement)

`stop(jobId)` cancels a running workflow. Cancel and undo are separate concerns:

- **cancel**: abort in-flight AI calls, mark workflow as "cancelled".
  Completed tasks keep their DB writes. Pending tasks stay pending.
- **undo** (future): restore DB state to pre-workflow. Requires snapshotting.

Mechanism: `AbortController`. Engine holds a controller per running task.
AbortController plumbing already exists in AITaskClient (used for timeouts).
Just needs to be wired from engine → task → AI call.

## TODO: Integration

- **Bootstrapping**: who creates the `WfEngine`? Need to instantiate all 6 tasks,
  build the task map, and pass it + `workflowRegistry` + `workflowRepo` to the
  constructor.

- **IPC handlers**: `workflow:start`, `workflow:retry`, `workflow:getState`.
  Thin layer connecting renderer → engine.

- **IPC broadcast**: listen to `workflow:pushState` and `workflow:aiPartial`
  events on the main process and forward them to `BrowserWindow` via
  `webContents.send()`.
