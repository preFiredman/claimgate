export const AGENT_IDS = ["extractor", "evidence", "gate"] as const;
export type AgentId = (typeof AGENT_IDS)[number];

export const EVIDENCE_STATUSES = ["supported", "weak", "unsupported"] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const CLAIM_KINDS = ["outcome", "fact", "plan", "opinion"] as const;
export type ClaimKind = (typeof CLAIM_KINDS)[number];

export type StepStatus = "queued" | "running" | "done" | "error";
export type RunStatus = "idle" | "running" | "done" | "error";

export type Claim = {
  id: string;
  text: string;
  kind: ClaimKind;
  status?: EvidenceStatus;
  evidence?: string;
  reason?: string;
};

export type BlockedItem = {
  claimId: string;
  original: string;
  action: "removed" | "rewritten";
  replacement?: string;
  reason: string;
};

export type GateResult = {
  finalDraft: string;
  blocked: BlockedItem[];
  summary: string;
};

export type PipelineStep = {
  id: AgentId;
  status: StepStatus;
  note: string;
};

export type Run = {
  id: string;
  title: string;
  draft: string;
  status: RunStatus;
  steps: PipelineStep[];
  claims: Claim[];
  result: GateResult | null;
  createdAt: number;
  error?: string;
};
