import { toast } from "sonner";
import { runAgent } from "./server";
import { selectActiveRun, useClaimGate } from "./store";

let inflight = false;
let startedAt = 0;

export function isEngineBusy() {
  if (inflight && Date.now() - startedAt > 240_000) inflight = false;
  return inflight;
}

export async function launchGate(draft: string) {
  const trimmed = draft.trim();
  if (!trimmed || isEngineBusy()) return;
  inflight = true;
  startedAt = Date.now();

  const store = useClaimGate.getState();
  const id = store.startRun(trimmed);

  try {
    store.startStep(id, "extractor");
    const extracted = await runAgent({ data: { step: "extractor", draft: trimmed } });
    if (!extracted.ok) {
      store.failRun(id, extracted.error);
      toast.error(extracted.error);
      return;
    }
    store.finishExtractor(id, extracted.claims);

    const current = selectActiveRun();
    if (!current || current.id !== id) return;

    store.startStep(id, "evidence");
    const scored = await runAgent({
      data: { step: "evidence", draft: trimmed, claims: extracted.claims },
    });
    if (!scored.ok) {
      store.failRun(id, scored.error);
      toast.error(scored.error);
      return;
    }
    store.finishEvidence(id, scored.claims);

    if (!selectActiveRun() || selectActiveRun()?.id !== id) return;

    store.startStep(id, "gate");
    const gated = await runAgent({
      data: { step: "gate", draft: trimmed, claims: scored.claims },
    });
    if (!gated.ok) {
      store.failRun(id, gated.error);
      toast.error(gated.error);
      return;
    }
    if (!gated.result) {
      store.failRun(id, "Gate returned no draft.");
      toast.error("Gate returned no draft.");
      return;
    }
    store.finishGate(id, gated.result);
    toast.success(gated.result.summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline interrupted";
    store.failRun(id, message);
    toast.error(message);
  } finally {
    inflight = false;
  }
}
