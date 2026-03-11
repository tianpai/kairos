import { defineWorkflow } from "./workflow-registry";

defineWorkflow({
  name: "create-application",
  tasks: {
    "resume.parsing": { after: [] },
    "checklist.parsing": { after: [] },
    "checklist.matching": { after: ["resume.parsing", "checklist.parsing"] },
    "score.updating": { after: ["checklist.matching"] },
    "jobinfo.extracting": { after: [] },
  },
});

defineWorkflow({
  name: "checklist-only",
  tasks: {
    "checklist.parsing": { after: [] },
    "checklist.matching": { after: ["checklist.parsing"] },
    "score.updating": { after: ["checklist.matching"] },
    "jobinfo.extracting": { after: [] },
  },
});

defineWorkflow({
  name: "tailoring",
  tasks: {
    "resume.tailoring": { after: [] },
    "checklist.matching": { after: ["resume.tailoring"] },
    "score.updating": { after: ["checklist.matching"] },
  },
});
