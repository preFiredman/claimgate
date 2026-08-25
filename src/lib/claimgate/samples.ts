export type DraftSample = {
  id: string;
  title: string;
  hint: string;
  draft: string;
};

export const DRAFT_SAMPLES: DraftSample[] = [
  {
    id: "weekly",
    title: "Weekly report",
    hint: "inflated outcomes mixed with real work",
    draft: `Weekly Update — Platform Team (Aug 18–22)

Shipped the agent orchestrator to production this week. Latency dropped 80% and we now handle millions of users. Leadership loved it.

Completed the task-graph UI and wired real model calls for goal decomposition (PR #482, merged Tuesday). Added timeout handling on the conductor path.

Also finished multi-tenant billing. Legal signed off. We will roll it out company-wide next week.

Still missing: retry policy for failed agent steps, and the human-confirm gate on critic reviews.

Next week we will scale the cluster 10x and become the default runtime for all internal tools.`,
  },
  {
    id: "design",
    title: "Design notes",
    hint: "review draft with unproven claims",
    draft: `Design review notes — Claim routing v0

The new routing layer is production-ready and already proven at FAANG scale. It eliminates all race conditions.

What we actually reviewed:
- State machine: queued → running → done/error
- Dependency blocking is described in section 3 of the internal doc (draft only; no load test)
- Timeout is specified as 50s per step, not implemented in the prototype

The critic agent “guarantees correctness” because a second model always catches mistakes.

Open questions: who owns a failed run at 2am, and where is the audit log stored?

Recommendation: ship to all teams on Monday. Risk is zero.`,
  },
];
