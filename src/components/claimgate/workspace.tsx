import { RotateCw } from "lucide-react";
import { ClaimsPanel } from "./claims-panel";
import { OutputPanel } from "./output-panel";
import { Stepper } from "./stepper";
import { Button } from "@/components/ui/button";
import { isEngineBusy, launchGate } from "@/lib/claimgate/engine";
import type { Run } from "@/lib/claimgate/types";
import { useState } from "react";

export function Workspace({ run }: { run: Run }) {
  const [retrying, setRetrying] = useState(false);
  const extracting = run.steps.find((s) => s.id === "extractor")?.status === "running";

  async function retry() {
    if (retrying || isEngineBusy()) return;
    setRetrying(true);
    try {
      await launchGate(run.draft);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
            {run.status === "running" && "Pipeline running"}
            {run.status === "done" && "Gate complete"}
            {run.status === "error" && "Pipeline stopped"}
          </p>
          <h2 className="truncate font-display text-2xl leading-tight text-fg">{run.title}</h2>
        </div>
        {run.status === "error" ? (
          <Button variant="outline" size="sm" onClick={() => void retry()} disabled={retrying}>
            <RotateCw className="size-3.5" />
            Retry
          </Button>
        ) : null}
      </header>

      <Stepper steps={run.steps} />

      {run.error ? <p className="text-sm text-danger">{run.error}</p> : null}

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-12 lg:min-h-[520px]">
        <section className="flex h-full min-h-[240px] flex-col rounded-lg border border-border bg-surface lg:col-span-3">
          <header className="border-b border-border px-4 py-3">
            <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
              Source
            </p>
            <p className="text-sm text-fg">Original draft</p>
          </header>
          <pre className="min-h-[140px] flex-1 overflow-auto px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted">
            {run.draft}
          </pre>
        </section>
        <div className="min-h-[280px] h-full lg:col-span-4">
          <ClaimsPanel claims={run.claims} extracting={extracting} />
        </div>
        <div className="min-h-[280px] h-full lg:col-span-5">
          <OutputPanel result={run.result} status={run.status} />
        </div>
      </div>
    </div>
  );
}
