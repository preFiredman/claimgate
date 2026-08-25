import { createServerFn } from "@tanstack/react-start";
import {
  AGENT_IDS,
  CLAIM_KINDS,
  EVIDENCE_STATUSES,
  type AgentId,
  type Claim,
  type ClaimKind,
  type EvidenceStatus,
  type GateResult,
} from "./types";

function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  let raw = (fence?.[1] ?? text).trim();
  const start = raw.indexOf("{");
  if (start < 0) throw new Error("Model did not return JSON");
  raw = raw.slice(start);
  try {
    return JSON.parse(raw);
  } catch {
    const lastBrace = raw.lastIndexOf("}");
    if (lastBrace > 0) {
      let candidate = raw.slice(0, lastBrace + 1);
      const extraArrays =
        (candidate.match(/\[/g) ?? []).length - (candidate.match(/\]/g) ?? []).length;
      const extraObjects =
        (candidate.match(/\{/g) ?? []).length - (candidate.match(/\}/g) ?? []).length;
      candidate += "]".repeat(Math.max(0, extraArrays)) + "}".repeat(Math.max(0, extraObjects));
      try {
        return JSON.parse(candidate);
      } catch {
        /* salvage objects below */
      }
    }
    const objs = [...raw.matchAll(/\{[^{}]*\}/g)]
      .map((m) => {
        try {
          return JSON.parse(m[0]) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .filter((o): o is Record<string, unknown> => o !== null);
    if (objs.length === 0) throw new Error("Model did not return JSON");
    return { claims: objs, blocked: objs };
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function localGate(draft: string, claims: Claim[]): GateResult {
  const blockedClaims = claims.filter(
    (c) => c.status === "unsupported" && (c.kind === "outcome" || c.kind === "opinion"),
  );
  let finalDraft = draft;
  const blocked: GateResult["blocked"] = [];
  for (const claim of blockedClaims) {
    const seed = escapeRegExp(claim.text.slice(0, 28));
    const sentenceRe = new RegExp(`[^\\n.]*${seed}[^\\n.]*\\.?`, "i");
    if (seed && sentenceRe.test(finalDraft)) {
      finalDraft = finalDraft.replace(sentenceRe, "").replace(/\n{3,}/g, "\n\n");
    }
    blocked.push({
      claimId: claim.id,
      original: claim.text,
      action: "removed",
      reason: claim.reason ?? "Unsupported outcome without evidence.",
    });
  }
  return {
    finalDraft: finalDraft.replace(/[ \t]+\n/g, "\n").trim(),
    blocked,
    summary: `${blocked.length} blocked · ${claims.filter((c) => c.status === "supported").length} supported`,
  };
}


function asKind(value: unknown): ClaimKind {
  return CLAIM_KINDS.includes(value as ClaimKind) ? (value as ClaimKind) : "outcome";
}

function asStatus(value: unknown): EvidenceStatus | undefined {
  return EVIDENCE_STATUSES.includes(value as EvidenceStatus)
    ? (value as EvidenceStatus)
    : undefined;
}

function normalizeClaims(raw: unknown): Claim[] {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const list = Array.isArray(obj.claims)
    ? obj.claims
    : Array.isArray(raw)
      ? raw
      : [];
  const claims: Claim[] = list.slice(0, 12).map((item, i) => {
    const c = (item ?? {}) as Record<string, unknown>;
    return {
      id: String(c.id ?? `c${i + 1}`),
      text: String(c.text ?? c.claim ?? c.statement ?? "").trim(),
      kind: asKind(c.kind),
      status: asStatus(c.status),
      evidence: c.evidence ? String(c.evidence) : undefined,
      reason: c.reason ? String(c.reason) : undefined,
    };
  });
  return claims.filter((c) => c.text.length > 0);
}

function normalizeGate(raw: unknown, claims: Claim[]): GateResult {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const blockedRaw = Array.isArray(obj.blocked) ? obj.blocked : [];
  const blocked = blockedRaw.map((item) => {
    const b = (item ?? {}) as Record<string, unknown>;
    return {
      claimId: String(b.claimId ?? ""),
      original: String(b.original ?? b.text ?? ""),
      action: b.action === "rewritten" ? ("rewritten" as const) : ("removed" as const),
      replacement: b.replacement ? String(b.replacement) : undefined,
      reason: String(b.reason ?? "Unsupported outcome without evidence."),
    };
  });
  let finalDraft = String(obj.finalDraft ?? obj.draft ?? "").trim();
  if (!finalDraft) {
    finalDraft = claims
      .filter((c) => c.status !== "unsupported")
      .map((c) => `- ${c.text}`)
      .join("\n");
  }
  const summary = String(
    obj.summary ??
      `${blocked.length} blocked · ${claims.filter((c) => c.status === "supported").length} supported`,
  );
  return { finalDraft, blocked, summary };
}

async function chat(opts: {
  system: string;
  user: string;
  maxTokens: number;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "AI is not available in this environment. Try again later." };
  }

  let res: Response;
  try {
    res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.2,
        max_tokens: opts.maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
      }),
    });
  } catch {
    return { ok: false, error: "The model timed out. Please run the gate again." };
  }

  if (!res.ok) {
    return { ok: false, error: `Model call failed (${res.status}).` };
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) return { ok: false, error: "The model returned an empty response." };
  return { ok: true, text };
}

const SYSTEMS: Record<AgentId, string> = {
  extractor: `You are ClaimGate Extractor. Extract every claim from a technical weekly report or design draft.
A claim is any statement presented as fact, outcome, metric, accomplishment, approval, commitment, or plan.
Be strict and over-include inflated outcomes. Do not invent claims that are not in the draft.
kind:
- outcome: shipped, finished, improved, metric, “everyone loved”, “risk is zero”
- fact: concrete artifact with identifier (PR, file, date, measured timeout)
- plan: next week / will do
- opinion: qualitative praise without measurement
Return compact JSON only. Reasons ≤12 words. Max 12 claims.
{ "claims": [{ "id": "c1", "text": "verbatim or tight paraphrase", "kind": "outcome|fact|plan|opinion" }] }
English.`,
  evidence: `You are ClaimGate Evidence. Score each claim using ONLY the provided draft. No world knowledge.
supported: the draft cites a concrete artifact (PR #, file, date, specified number with source)
weak: some detail exists but not enough to stand as a shipped outcome
unsupported: outcome, metric, approval, scale, or guarantee with no evidence in the draft
Return compact JSON only. Reasons ≤12 words.
{ "claims": [{ "id", "text", "kind", "status": "supported|weak|unsupported", "evidence": "quote or none", "reason": "short" }] }`,
  gate: `You are ClaimGate Gate. Hard rule: unsupported OUTCOME claims cannot appear in the final draft.
- Remove or rewrite unsupported outcome sentences so they no longer assert unproven results.
- Rewrite weak outcomes as tentative (in progress / no metric yet), not as victories.
- Keep supported facts. Keep genuine plans. Do not add new claims.
- Preserve useful structure of the original.
Return JSON only:
{
  "finalDraft": "markdown",
  "blocked": [{ "claimId", "original", "action": "removed"|"rewritten", "replacement": "optional", "reason": "why" }],
  "summary": "short"
}`,
};

export const runAgent = createServerFn({ method: "POST" })
  .validator(
    (input: { step: AgentId; draft: string; claims?: Claim[] }) => ({
      step: AGENT_IDS.includes(input.step) ? input.step : "extractor",
      draft: input.draft.trim().slice(0, 8000),
      claims: Array.isArray(input.claims) ? input.claims.slice(0, 12) : [],
    }),
  )
  .handler(async ({ data }) => {
    if (!data.draft) return { ok: false as const, error: "Paste a draft first." };

    const claimsBlock =
      data.claims.length === 0
        ? "(none yet)"
        : JSON.stringify(data.claims, null, 2);

    const result = await chat({
      maxTokens: data.step === "gate" ? 1400 : data.step === "evidence" ? 1600 : 800,
      system: SYSTEMS[data.step],
      user:
        data.step === "extractor"
          ? data.draft
          : `DRAFT:\n${data.draft}\n\nCLAIMS:\n${claimsBlock}`,
    });

    if (!result.ok) {
      if (data.step === "gate" && data.claims.length > 0) {
        return {
          ok: true as const,
          step: data.step,
          claims: data.claims,
          result: localGate(data.draft, data.claims),
        };
      }
      return result;
    }

    try {
      const parsed = extractJson(result.text);
      if (data.step === "gate") {
        return {
          ok: true as const,
          step: data.step,
          claims: data.claims,
          result: normalizeGate(parsed, data.claims),
        };
      }
      const claims = normalizeClaims(parsed);
      if (claims.length === 0) {
        return { ok: false as const, error: "No claims found. Try a longer draft." };
      }
      return { ok: true as const, step: data.step, claims, result: null };
    } catch (err) {
      console.error("[claimgate] parse", data.step, err, result.text.slice(0, 400));
      if (data.step === "gate" && data.claims.length > 0) {
        return {
          ok: true as const,
          step: data.step,
          claims: data.claims,
          result: localGate(data.draft, data.claims),
        };
      }
      return { ok: false as const, error: "Could not parse that step. Run the gate again." };
    }
  });
