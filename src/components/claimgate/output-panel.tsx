import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GateResult, RunStatus } from "@/lib/claimgate/types";

export function OutputPanel({
  result,
  status,
}: {
  result: GateResult | null;
  status: RunStatus;
}) {
  const [copied, setCopied] = useState(false);
  const gating = status === "running" && !result;

  async function copy() {
    if (!result?.finalDraft) return;
    await navigator.clipboard.writeText(result.finalDraft);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-surface">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
            Submission draft
          </p>
          <p className="text-sm text-fg">
            {result ? result.summary : gating ? "Gate is rewriting…" : "Waiting for Gate"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void copy()}
          disabled={!result?.finalDraft}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </header>
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(140px,1fr)_auto] overflow-hidden">
        <div className="overflow-y-auto px-4 py-3">
          {result?.finalDraft ? (
            <article className="prose-draft text-sm leading-relaxed whitespace-pre-wrap text-fg">
              {result.finalDraft}
            </article>
          ) : (
            <p className="py-8 text-center text-sm text-subtle">
              The gated draft lands here. Unsupported outcomes will be removed or rewritten.
            </p>
          )}
        </div>
        <div className="max-h-48 overflow-y-auto border-t border-border">
          <p className="px-4 pt-3 font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
            Blocked
          </p>
          {result && result.blocked.length > 0 ? (
            <ul className="space-y-2 p-3 pt-2">
              {result.blocked.map((item, i) => (
                <li key={`${item.claimId}-${i}`} className="rounded-sm bg-danger/10 px-3 py-2">
                  <p className="text-xs font-medium text-danger">
                    {item.action} · {item.claimId || "claim"}
                  </p>
                  <p className="mt-0.5 text-sm text-fg">{item.original}</p>
                  {item.replacement ? (
                    <p className="mt-1 text-xs text-muted">→ {item.replacement}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-subtle">{item.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-xs text-subtle">
              {result ? "Nothing blocked." : "Blocked sentences list here after Gate."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
