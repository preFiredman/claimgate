# Project Story (paste into Devpost)

## Inspiration

The hardest part of writing a technical weekly update or design review isn’t drafting—it’s standing behind every claim. Drafts often sound polished but thin: strong outcome language, weak or missing evidence. After a few AI rewrites, outdated details and empty phrasing get mixed in.

Discussions around multi-agent review point to the same failure mode: when two agents check each other without a hard rule that objections need evidence, they tend to agree anyway. We narrowed that insight into a small product wedge—block unsupported technical claims before the draft is treated as done.

## What it does

ClaimGate is built for technical weekly reports, design notes, and review drafts.

1. Paste a draft
2. Extractor pulls out claims and outcome statements
3. Evidence labels each claim: supported / weak / unsupported
4. Gate returns two outputs:
   - a submission-ready version (unsupported outcome language removed or rewritten)
   - a rejection list (what was blocked and why)

It is not a general writing assistant. It does one job: **force key technical statements through an evidence gate.**

## How we built it

- A fixed three-agent pipeline (no dynamic routing)
- Claims normalized into structured JSON: claim / evidence_status / reason
- One hard Gate rule: unsupported outcome claims cannot enter the final draft
- UI kept to three panels: source draft, claim list, final draft + blocked items
- Model calls capped with token limits and timeouts so a full run is demo-friendly
- Lenient JSON salvage if a step truncates; local strip fallback if Gate fails

## Challenges we ran into

1. “What counts as evidence” is subjective—so we reduced it to checkable labels instead of free-form judgment
2. Models treat rhetoric as fact—Extractor is intentionally strict and over-includes rather than misses claims
3. Long JSON from Evidence was truncating—so we capped claim count, asked for compact output, and salvage-parse incomplete arrays
4. Scope creep toward a platform—every feature request was cut unless it served the evidence gate

## Accomplishments that we're proud of

- A real writing pain point compressed into a demo that can finish in minutes
- Output that is not “a smoother essay,” but a **gated draft with explicit rejection reasons**
- Proof that a small agent set with hard constraints beats a larger unconstrained agent team for this task
- Live UI that shows the pipeline: queued → running → scored claims → blocked list

## What we learned

Multi-agent value is less about role count and more about enforceable handoff rules.
For technical writing, one rule—**no evidence, no claim**—is more useful than a general-purpose agent stack.

## What's next for ClaimGate

- Accept commit / PR links as evidence sources
- Turn “weak evidence” into a one-click “add evidence” interaction
- Ship a team weekly-report template while keeping the same evidence gate (still not a platform)
