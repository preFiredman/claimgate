import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Toaster } from "sonner";
import { Composer } from "./composer";
import { Workspace } from "./workspace";
import { Button } from "@/components/ui/button";
import { HARD_RULE } from "@/lib/claimgate/agents";
import { isEngineBusy, launchGate } from "@/lib/claimgate/engine";
import { useClaimGate } from "@/lib/claimgate/store";
import { cn } from "@/lib/utils";

function formatTime(t: number) {
  return new Date(t).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function ClaimGateApp() {
  const { runs, activeId, setActive, hydrated, setHydrated, failRun } = useClaimGate();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.resolve(useClaimGate.persist.rehydrate()).then(() => {
      const state = useClaimGate.getState();
      for (const run of state.runs) {
        if (run.status === "running") {
          failRun(run.id, "Previous session interrupted. Run the gate again.");
        }
      }
      setHydrated();
    });
  }, [failRun, setHydrated]);

  const active = runs.find((r) => r.id === activeId);
  const showWorkspace = Boolean(active);

  async function start() {
    if (!draft.trim() || isEngineBusy()) return;
    setBusy(true);
    try {
      await launchGate(draft);
    } finally {
      setBusy(false);
    }
  }

  function newJob() {
    setActive(null);
    setDraft("");
  }

  if (!hydrated) {
    return <div className="min-h-dvh bg-bg" />;
  }

  return (
    <div className="flex min-h-dvh flex-col text-fg">
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          className: "bg-raised text-fg border border-border font-sans",
        }}
      />

      <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <button type="button" onClick={newJob} className="flex items-center gap-3 text-left">
          <span className="grid size-8 place-items-center rounded-sm border border-border-strong bg-raised">
            <span className="block h-3 w-2.5 border border-accent/80" />
          </span>
          <span>
            <span className="block font-display text-lg leading-none tracking-tight">
              ClaimGate
            </span>
            <span className="mt-1 hidden text-[11px] tracking-[0.14em] text-muted uppercase sm:block">
              Evidence gate
            </span>
          </span>
        </button>
        {showWorkspace ? (
          <Button variant="outline" size="sm" onClick={newJob}>
            <Plus className="size-3.5" />
            New draft
          </Button>
        ) : null}
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 pb-8 sm:px-6 lg:flex-row lg:gap-8">
        <aside className="mb-6 w-full shrink-0 lg:mb-0 lg:w-56">
          <p className="mb-3 text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
            Recent gates
          </p>
          {runs.length === 0 ? (
            <p className="text-sm text-subtle">No runs yet.</p>
          ) : (
            <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              {runs.map((run) => (
                <li key={run.id} className="min-w-[200px] lg:min-w-0">
                  <button
                    type="button"
                    onClick={() => setActive(run.id)}
                    className={cn(
                      "w-full rounded-md border px-3 py-2.5 text-left transition-colors",
                      run.id === activeId
                        ? "border-border-strong bg-raised"
                        : "border-border bg-surface hover:border-border-strong",
                    )}
                  >
                    <p className="truncate text-sm text-fg">{run.title}</p>
                    <p className="mt-1 font-mono text-[11px] text-subtle">
                      {formatTime(run.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col lg:min-h-[calc(100dvh-6.5rem)]">
          {showWorkspace && active ? (
            <Workspace run={active} />
          ) : (
            <div className="flex flex-1 flex-col justify-center py-6 sm:py-12">
              <p className="mb-3 text-center font-mono text-[11px] tracking-[0.22em] text-muted uppercase">
                Extractor · Evidence · Gate
              </p>
              <h1 className="mx-auto max-w-3xl text-center font-display text-[2.15rem] leading-[1.12] font-medium tracking-tight text-fg sm:text-5xl">
                No evidence, no claim.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-center text-sm leading-relaxed text-muted sm:text-base">
                Paste a technical weekly report or design draft. Three agents extract claims,
                score evidence, and keep unsupported outcomes out of the submission draft.
              </p>
              <p className="mx-auto mt-3 max-w-xl text-center text-xs text-subtle">{HARD_RULE}</p>
              <div className="mt-8">
                <Composer
                  value={draft}
                  onChange={setDraft}
                  onSubmit={() => void start()}
                  busy={busy}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
