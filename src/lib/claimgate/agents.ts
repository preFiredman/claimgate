import type { AgentId } from "./types";

export const AGENT_META: Record<
  AgentId,
  { label: string; short?: string; duty: string; index: number }
> = {
  extractor: {
    index: 1,
    label: "Extractor",
    duty: "Pull every claim, outcome, and metric from the draft.",
  },
  evidence: {
    index: 2,
    label: "Evidence",
    duty: "Mark each claim supported, weak, or unsupported.",
  },
  gate: {
    index: 3,
    label: "Gate",
    duty: "Block unsupported outcomes from the final draft.",
  },
};

export const HARD_RULE =
  "Unsupported outcome claims cannot enter the submission-ready draft.";
