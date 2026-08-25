import { LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HARD_RULE } from "@/lib/claimgate/agents";
import { DRAFT_SAMPLES } from "@/lib/claimgate/samples";
import { cn } from "@/lib/utils";

export function Composer({
  value,
  onChange,
  onSubmit,
  busy,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-xl border border-border bg-surface p-3 sm:p-4">
        <label className="sr-only" htmlFor="claimgate-draft">
          Draft
        </label>
        <textarea
          id="claimgate-draft"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Paste a weekly report or design review. Inflated outcomes will be gated."
          rows={11}
          disabled={busy}
          className="min-h-[220px] w-full resize-y bg-transparent font-mono text-sm leading-relaxed text-fg placeholder:text-subtle focus:outline-none disabled:opacity-60"
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="min-w-0 flex-1 text-xs leading-snug text-subtle">{HARD_RULE}</p>
          <Button
            className="h-11 w-full shrink-0 sm:w-auto sm:min-w-40"
            onClick={onSubmit}
            disabled={busy || !value.trim()}
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            {busy ? "Running gate" : "Run the gate"}
          </Button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {DRAFT_SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            disabled={busy}
            onClick={() => onChange(sample.draft)}
            className={cn(
              "min-h-11 rounded-md border border-border bg-surface px-3 py-2 text-left text-xs text-muted transition-colors hover:border-border-strong hover:text-fg disabled:opacity-50",
            )}
          >
            <span className="font-medium text-fg">{sample.title}</span>
            <span className="ml-2 text-subtle">{sample.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
