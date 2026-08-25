import { Badge } from "@/components/ui/badge";
import type { Claim, EvidenceStatus } from "@/lib/claimgate/types";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<EvidenceStatus, "ok" | "warn" | "danger"> = {
  supported: "ok",
  weak: "warn",
  unsupported: "danger",
};

export function ClaimsPanel({
  claims,
  extracting,
}: {
  claims: Claim[];
  extracting: boolean;
}) {
  const counts = {
    supported: claims.filter((c) => c.status === "supported").length,
    weak: claims.filter((c) => c.status === "weak").length,
    unsupported: claims.filter((c) => c.status === "unsupported").length,
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-surface">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
            Claims
          </p>
          <p className="text-sm text-fg">
            {claims.length === 0
              ? extracting
                ? "Extracting…"
                : "Waiting for Extractor"
              : `${claims.length} extracted`}
          </p>
        </div>
        {claims.some((c) => c.status) ? (
          <div className="flex gap-1.5">
            <Badge tone="ok">{counts.supported}</Badge>
            <Badge tone="warn">{counts.weak}</Badge>
            <Badge tone="danger">{counts.unsupported}</Badge>
          </div>
        ) : null}
      </header>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {claims.length === 0 ? (
          <li className="px-1 py-8 text-center text-sm text-subtle">
            {extracting
              ? "Extractor is pulling claims from the draft."
              : "Claims appear here after extraction."}
          </li>
        ) : (
          claims.map((claim) => (
            <li
              key={claim.id}
              className={cn(
                "rounded-md border border-border bg-raised px-3 py-2.5",
                claim.status === "unsupported" && "border-danger/35",
                claim.status === "weak" && "border-warn/30",
                claim.status === "supported" && "border-ok/25",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] text-subtle">{claim.id}</span>
                <Badge tone="muted">{claim.kind}</Badge>
                {claim.status ? (
                  <Badge tone={STATUS_TONE[claim.status]}>{claim.status}</Badge>
                ) : (
                  <Badge tone="muted">unscored</Badge>
                )}
              </div>
              <p className="mt-1.5 text-sm leading-snug text-fg">{claim.text}</p>
              {claim.reason ? (
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{claim.reason}</p>
              ) : null}
              {claim.evidence && claim.evidence !== "none" ? (
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-subtle">
                  {claim.evidence}
                </p>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
