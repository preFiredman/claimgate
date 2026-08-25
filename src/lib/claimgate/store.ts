import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AGENT_META } from "./agents";
import { AGENT_IDS, type Claim, type GateResult, type PipelineStep, type Run } from "./types";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function titleFromDraft(draft: string) {
  const line = draft.split("\n").find((l) => l.trim().length > 0) ?? "Untitled draft";
  return line.replace(/^#+\s*/, "").slice(0, 72);
}

function freshSteps(): PipelineStep[] {
  return AGENT_IDS.map((id) => ({
    id,
    status: "queued" as const,
    note: AGENT_META[id].duty,
  }));
}

type EngineState = {
  runs: Run[];
  activeId: string | null;
  hydrated: boolean;
  setHydrated: () => void;
  setActive: (id: string | null) => void;
  startRun: (draft: string) => string;
  startStep: (runId: string, stepId: PipelineStep["id"]) => void;
  finishExtractor: (runId: string, claims: Claim[]) => void;
  finishEvidence: (runId: string, claims: Claim[]) => void;
  finishGate: (runId: string, result: GateResult) => void;
  failRun: (runId: string, error: string) => void;
  removeRun: (id: string) => void;
};

export const useClaimGate = create<EngineState>()(
  persist(
    (set, get) => ({
      runs: [],
      activeId: null,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setActive: (id) => set({ activeId: id }),
      startRun: (draft) => {
        const id = uid("run");
        const run: Run = {
          id,
          title: titleFromDraft(draft),
          draft,
          status: "running",
          steps: freshSteps(),
          claims: [],
          result: null,
          createdAt: Date.now(),
        };
        set({ runs: [run, ...get().runs].slice(0, 16), activeId: id });
        return id;
      },
      startStep: (runId, stepId) => {
        set({
          runs: get().runs.map((r) =>
            r.id !== runId
              ? r
              : {
                  ...r,
                  steps: r.steps.map((s) =>
                    s.id === stepId ? { ...s, status: "running" } : s,
                  ),
                },
          ),
        });
      },
      finishExtractor: (runId, claims) => {
        set({
          runs: get().runs.map((r) =>
            r.id !== runId
              ? r
              : {
                  ...r,
                  claims,
                  steps: r.steps.map((s) =>
                    s.id === "extractor"
                      ? { ...s, status: "done", note: `${claims.length} claims extracted` }
                      : s,
                  ),
                },
          ),
        });
      },
      finishEvidence: (runId, claims) => {
        const unsupported = claims.filter((c) => c.status === "unsupported").length;
        set({
          runs: get().runs.map((r) =>
            r.id !== runId
              ? r
              : {
                  ...r,
                  claims,
                  steps: r.steps.map((s) =>
                    s.id === "evidence"
                      ? {
                          ...s,
                          status: "done",
                          note: `${unsupported} unsupported · ${claims.filter((c) => c.status === "supported").length} supported`,
                        }
                      : s,
                  ),
                },
          ),
        });
      },
      finishGate: (runId, result) => {
        set({
          runs: get().runs.map((r) =>
            r.id !== runId
              ? r
              : {
                  ...r,
                  result,
                  status: "done",
                  steps: r.steps.map((s) =>
                    s.id === "gate"
                      ? { ...s, status: "done", note: result.summary }
                      : s,
                  ),
                },
          ),
        });
      },
      failRun: (runId, error) => {
        set({
          runs: get().runs.map((r) =>
            r.id !== runId
              ? r
              : {
                  ...r,
                  status: "error",
                  error,
                  steps: r.steps.map((s) =>
                    s.status === "running" ? { ...s, status: "error", note: error } : s,
                  ),
                },
          ),
        });
      },
      removeRun: (id) => {
        const next = get().runs.filter((r) => r.id !== id);
        set({
          runs: next,
          activeId: get().activeId === id ? (next[0]?.id ?? null) : get().activeId,
        });
      },
    }),
    {
      name: "claimgate-runs",
      skipHydration: true,
      partialize: (s) => ({ runs: s.runs, activeId: s.activeId }),
    },
  ),
);

export function selectActiveRun(): Run | undefined {
  const { runs, activeId } = useClaimGate.getState();
  return runs.find((r) => r.id === activeId);
}
