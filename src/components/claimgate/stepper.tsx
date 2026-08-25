import { Check, LoaderCircle, X } from "lucide-react";
import { AGENT_META } from "@/lib/claimgate/agents";
import type { PipelineStep } from "@/lib/claimgate/types";
import { cn } from "@/lib/utils";

export function Stepper({ steps }: { steps: PipelineStep[] }) {
  return (
    <ol className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {steps.map((step, i) => {
        const meta = AGENT_META[step.id];
        return (
          <li
            key={step.id}
            className={cn(
              "rounded-md border px-3 py-3 transition-colors",
              step.status === "running" && "border-border-strong bg-raised",
              step.status === "done" && "border-border bg-surface",
              step.status === "error" && "border-danger/40 bg-danger/10",
              step.status === "queued" && "border-border bg-surface/60",
            )}
          >
            <div className="flex items-center gap-2">
              <StatusDot status={step.status} />
              <p className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
                0{i + 1} {meta.label}
              </p>
            </div>
            <p className="mt-1 text-sm text-fg">{step.note}</p>
          </li>
        );
      })}
    </ol>
  );
}

function StatusDot({ status }: { status: PipelineStep["status"] }) {
  if (status === "running") {
    return <LoaderCircle className="size-3.5 animate-spin text-accent" />;
  }
  if (status === "done") {
    return <Check className="size-3.5 text-ok" />;
  }
  if (status === "error") {
    return <X className="size-3.5 text-danger" />;
  }
  return <span className="size-2.5 rounded-full border border-border-strong" />;
}
