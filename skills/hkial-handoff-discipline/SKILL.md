---
name: hkial-handoff-discipline
description: Handoff doc template + 3 subproject locations for HKIAL work. Use at the END of every material session to write `docs/handoff/<date>-<task>.md` so the next session (or Sky) can pick up where you left off. Covers the 6 sections (TL;DR / What shipped / Files / Pre-existing fails / Deploy reminder / Follow-ups), when to write one (material change vs trivial), and the per-subproject location map. Trigger: "handoff", "write the doc", "wrap up", "session end", "what did I ship", "next session".
tags: []
version: 1.0.0
author: Hermes Agent
license: MIT
last-verified: 2026-06-13
applies-to-rounds: 6.0+
metadata:
  hermes:
    tags: [HKIAL, handoff, docs, session, TLDR, deploy-reminder, follow-ups, subproject-locations, pre-existing-fails]
---

# HKIAL Handoff Discipline

> **When to use**: At the end of every material session (bug fix, feature, refactor). The handoff doc is the contract between sessions — without it, the next session (or Sky) re-discovers context you already had. Cross-references: HKIAL/AGENTS.md §5 (deploy reminder), `HKIAL/skills/hkial-pre-commit-gate/` (Phase 4 completes with the handoff).
>
> **The 3 locations** (one per subproject; pick the one that matches the primary work):
> - Customer (`frontend_react/`): `frontend_react/frontend/docs/handoff/<date>-<task>.md`
> - Admin (`backend/hkial-react/`): `backend/hkial-react/docs/handoff/<date>-<task>.md`
> - API (`backend/hkial-api/`): `backend/hkial-api/docs/handoff/<date>-<task>.md` (when this dir is created; currently API uses `PROBLEM.md` and inline comments)
> - Cross-project (deploy, monorepo, both frontends): `HKIAL/handoff/<date>-<task>.md` (this folder)

## 1. When to write a handoff (the trigger table)

| Session type | Write handoff? | Why |
|---|---|---|
| Multi-file bug fix (e.g. "X 唔喺 total" with 5-layer audit) | **Yes** | Next session needs the audit trail to verify the fix |
| New feature (>2 files, >1 frontend surface) | **Yes** | Future refactor sessions need the design intent |
| Round-N pricing arithmetic (Q8, K-class conflict) | **Yes** | The audit script + HTML review are the contract |
| figma-ui minimal patch (INV-X1) | **Yes** | Sky needs to know which file to sync (no commit / pointer bump from agent) |
| Deploy (3-app coordinated) | **Yes** | The push + restart commands are the handoff payload |
| Trivial 1-line typo fix | No | The commit message is enough |
| Documentation update (AGENTS.md, README) | No | The diff is self-explanatory |
| Skill authoring (new Hermes skill) | Optional | The skill metadata is the contract |

When in doubt, write one. A 1-paragraph handoff is better than none.

## 2. The 6-section template

```markdown
# <Task name> — <date>

## TL;DR
<1-2 sentences. What changed, what was the trigger, what's the new state. Include the bug class or round number if applicable.>

## What shipped
- <commit SHA 1>: <1-line description>
- <commit SHA 2>: <1-line description>
- <commit SHA 3>: <1-line description>
- Test counts: PHPUnit <N>/<N>, Vitest <N>/<N>, Playwright <N>/<N>

## Files touched
- `<path/to/file1>`: <1-line description of change>
- `<path/to/file2>`: <1-line description>
- `<new file path>`: <new>

## Pre-existing fails noted
- `<TestFile>`: <N> cases pre-existing fail (not yours, deferred to <ticket>)
- `<TSC error count>`: pre-existing TypeScript errors (do not add to count)

## Deploy reminder for Sky
- [ ] <Image 1> needs to be rebuilt + pushed
- [ ] <Image 2> needs to be rebuilt + pushed
- [ ] <Container instance> needs to be restarted (after push)
- [ ] figma-ui submodule has uncommitted working-tree changes (manual sync per INV-X1)

## Follow-ups
- <Task X> deferred (reason)
- <Task Y> blocked on <user Q1, Q2>
- <Test coverage gap> (e.g. "no test for X edge case")
```

## 3. The TL;DR rule (1-2 sentences, no preamble)

The TL;DR is the most-read section. Write it for the next session's first 10 seconds:
- "Round 6.2.34: payment mode mapper on BookingReviewPage mislabels OnCredit as 'Bulk Purchase/Monthly Invoice'. Fix: added case 'OnCredit' → 'On-Credit' + changed default to 'On-Credit'. Same bug in BookingReview.tsx:72 also fixed."
- "Round 6.2.28: customer NewBooking addon prices now use real bookable_items catalog instead of hardcoded literals. 10 new unit tests, 7-layer pre-flight applied."

**Anti-pattern**: "In this session, I explored several approaches to..." → start with the outcome, not the journey.

## 4. Per-subproject location map (where to write)

| Primary work | Location | Existing examples (2026-06-11) |
|---|---|---|
| Customer NewBooking, EditBooking, /mybooking, /auth, /dashboard | `frontend_react/frontend/docs/handoff/<date>-<task>.md` | `2026-06-11-customer-edit-booking-coverage-phase-0-1.md`, `2026-06-11-customer-edit-booking-coverage-phase-2-3.md` |
| Admin CreateBooking, EditBooking, BookingDetail, BookingReview, PriceManagement, Accounts | `backend/hkial-react/docs/handoff/<date>-<task>.md` | `2026-06-11-booking-detail-ld-vip-allow-zero.md`, `2026-06-11-customer-profile-real-data.md`, `2026-06-11-edit-booking-3-bug-fix.md`, `2026-06-11-edit-booking-coverage-phase-0-1.md`, `2026-06-11-remove-edit-button-booking-list.md` |
| Pending design Q&A / multi-phase plans (NOT yet shipped) | `backend/hkial-react/docs/pending-changes/<date>-<topic>-plan.md` | `2026-06-10-6.2.33-infant-nfg-zero-charge.md`, `2026-06-10-price-preview-trigger-by-quantity.md`, `2026-06-11-edit-booking-coverage-plan.md` |
| API (Laravel) — controller, service, migration | `backend/hkial-api/docs/handoff/<date>-<task>.md` (when dir is created) | (Currently: write to `PROBLEM.md` or the round-specific handoff in customer/admin) |
| Cross-project (3-app deploy, monorepo commit, both frontends) | `HKIAL/handoff/<date>-<task>.md` (this folder) | (none yet — create on first cross-project deploy) |

**Rule**: pick the location that matches the PRIMARY work, even if the change touches 2 subprojects. Cross-reference the other subproject in the "Files touched" section.

## 5. The README.md index (link from each handoff)

For each subproject's `docs/handoff/`, maintain a chronological `README.md` index:

```markdown
# <Subproject> Handoff Index

| Date | Task | TL;DR |
|---|---|---|
| 2026-06-11 | customer-profile-real-data | 4 figma-ui files + 2 parent-repo files now use real data instead of mock |
| 2026-06-11 | edit-booking-3-bug-fix | 3 bugs in EditBooking fixed (leg2 fields, NFG section, time field) |
| 2026-06-11 | edit-booking-coverage-phase-0-1 | Phase 0 + 1 of edit-booking coverage plan shipped (Phase 2-4 deferred) |
| 2026-06-11 | booking-detail-ld-vip-allow-zero | LD VIP=0 rule now intent-gated (no false-positive on no-LD case) |
| 2026-06-11 | remove-edit-button-booking-list | Edit button removed from admin BookingManagement list |
```

When you write a new handoff, add 1 row to the index.

## 6. The "deploy reminder" section (the 1 thing Sky reads first)

Sky skims the handoff doc when planning the next deploy. The "Deploy reminder for Sky" section must be:
- A checkbox list (so Sky can tick as they go)
- Specific (image names, container instance names, restart order)
- Honest (if there's a figma-ui submodule uncommitted patch, SAY SO)

**Anti-pattern**: "After this commit, please deploy" → too vague. Be specific: "After committing the wrapper change 28e914c, the customer frontend's `src/components/figma-ui/` has a working-tree patch (NOT committed, NO parent pointer bump from the agent, per INV-X1). Sky: `cd frontend_react/frontend/src/components/figma-ui && git diff` to see the patch, then sync to your Figma Make code base + figma-ui's own repo + bump the parent pointer in YOUR workflow (agent does NOT touch the submodule git)."

## 7. The "follow-ups" section (the contract for the next session)

The follow-ups section is the **explicit handoff** to the next session. Make it:
- Specific (don't say "more testing needed"; say "test the [scenario] case in [test file]")
- Owned (assign to "next session" or to Sky for design decisions)
- Scoped (1 follow-up = 1 task; don't bundle 5 things into "improve X")

**Anti-pattern**: "TODO: refactor pricing" → not actionable. Use: "TODO: extract PricingService::applyDiscount into a separate method, then add 2 more unit tests (K5, K6) covering the per-kind discount interaction. Defer to round 6.2.35+."

## 8. The "pre-existing fails" section (the audit trail)

When you run `php artisan test` and see 585/585 pass with 1 pre-existing fail, that 1 fail is **not yours to fix in this round**. Document it:

```markdown
## Pre-existing fails noted
- `tests/Feature/ContractManagementContractTest.php`: 1 case pre-existing fail
  (`test_admin_can_void_contract_even_when_member_active` — unrelated to current work, tracked separately)
- `npx tsc --noEmit` in `hkial-react/`: 76 pre-existing TypeScript errors
  (do not add to count; tracked in hkial-react/AGENTS.md §"Pre-existing")
- `tests/Feature/BookingFlowMatrixTest.php`: 5 cases pre-existing fail
  (deferred from round 6.2.31; feature-test cascade from PricingService L294 change)
```

This protects the next session from chasing your "fails" as their own.

## 9. Round-numbering convention (the chronological trace)

HKIAL uses round numbers (`6.0`, `6.1.1`, `6.2.7`, etc.) to track the chronological progression. Use them in the handoff TL;DR:
- "Round 6.2.34: ..."
- "Round 7.1: ..."
- "Direct-approve (no round number)"

The round number is the "git tag" of the conversation. When in doubt, check the previous handoff's TL;DR for the current round number and bump it.

## 10. The handoff doc vs the commit message (don't duplicate)

- **Commit message**: 1 line, what + why, references the round number
- **Handoff doc**: 6 sections, includes commit SHAs + test counts + follow-ups

The handoff is NOT a copy of the commit message. The handoff is the **session's deliverables** (the "what landed this session"), not the **commit's purpose** (the "why this change exists").

## 11. When the user says "don't write a handoff" or "skip the doc"

This is a Sky-style terse steering signal. Per INV-X7:
- If the change is trivial (1-line typo, doc update) → OK to skip
- If the change is material (multi-file, multi-round) → push back briefly: "this is 3 files + a 6.2.34 round, recommend writing a 1-paragraph handoff so the next session picks up. Skip if you want — just confirming."
- If Sky says "skip" → skip
- If Sky says "go ahead" → write a 1-paragraph handoff, not the full 6 sections

## 12. Related skills / cross-references

- `HKIAL/AGENTS.md` §5 (deploy reminder = part of the handoff)
- `HKIAL/skills/hkial-pre-commit-gate/` §7 (the "should I commit" checklist includes "handoff doc written")
- `HKIAL/skills/hkial-azure-deploy/` §5 (the deploy handoff is a specialisation of this skill)
- `backend/.opencode/agent/hermes.md` §"Handoff Doc Discipline"
- `backend/hkial-react/docs/handoff/README.md` (admin handoff index)
- `backend/hkial-react/docs/pending-changes/` (defer-with-marker docs)
- `frontend_react/frontend/docs/handoff/` (customer handoff index, created 2026-06-11)
