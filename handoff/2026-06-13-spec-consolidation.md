# Cross-Project Spec Consolidation — 2026-06-13

## TL;DR

Consolidated the 3-subproject HKIAL system (customer + admin + Laravel API) into a single cross-project canonical spec at `HKIAL/spec.md` v2.0.0. The old `backend/spec.md` (admin-only, March 2026) is now LEGACY. New `HKIAL/handoff/` folder created. New `HKIAL/.hermes/scripts/spec-audit.sh` script catches drift between spec, code, handoffs, skills, and pending-changes.

## What shipped

- **NEW: `HKIAL/spec.md`** (1324 lines, 79KB) — cross-project canonical spec v2.0.0
  - §0 Meta + update rule (anti-rott protocol)
  - §1 System overview (3 subprojects, ports, branches, figma-ui submodules)
  - §2 The 10 cross-project invariants (INV-X1..X10)
  - §3 The 13 backend design invariants (INV-1..13)
  - §4 The 12 frontend bug classes (#1..#12)
  - §5 The 12 contract-test-first anti-patterns (PIT-1..12)
  - §6 API contract (envelope, auth, key endpoints, delta protocol)
  - §7 Auth: dual-system spec (full rules)
  - §8 Booking domain (canonical data model + state machine)
  - §9 Pricing domain (K-class conflict protocol)
  - §10 Figma-UI submodule policy + sync workflow
  - §11 Test strategy (3-layer contract-first)
  - §12 Pre-commit gate (4 phases)
  - §13 Handoff discipline
  - §14 **Open bugs + pending rot (LIVE STATE)** — 3 P0 + 11 M + 8 L + 6 Q + 17 R
  - §15 **HKIAL-API dev order redesign (NEW)** — SPEC→SCHEMA→CONTRACT→IMPL→FRONTEND→E2E
  - §16 **Dev workflow redesign — anti-rott protocol (NEW)** — 5 rules + 4 consistency + audit script
  - §17 Cross-references + how to extend
  - Appendix A — Round → spec delta log (append-only)
- **NEW: `HKIAL/.hermes/scripts/spec-audit.sh`** (180 lines, executable) — quarterly anti-rott script
- **NEW: `HKIAL/handoff/`** (folder) — first cross-project handoff location per spec §13.2
- **MODIFIED: `backend/spec.md`** — added 5-line LEGACY redirect banner pointing to HKIAL/spec.md
- **MODIFIED: `HKIAL/AGENTS.md` §9** — added `⭐ HKIAL/spec.md` as the first "read on demand" doc
- **MODIFIED: `HKIAL/README.md`** — added `spec.md` as the first row in the orientation table
- **MODIFIED: `HKIAL/references/pointer-index.md` §1** — added `⭐ HKIAL canonical spec` as the first row
- **MODIFIED: `frontend_react/frontend/PROJECT_SUMMARY.md`** — added 5-line "spec has moved" banner
- **MODIFIED: `frontend_react/frontend/DEVELOPMENT_GUIDE.md`** — added 5-line "spec has moved" banner
- **MODIFIED: `frontend_react/frontend/BOOKING_VIEW_INVENTORY.md`** — added 5-line "spec has moved" banner
- **MODIFIED: `frontend_react/frontend/PROMO_CODE_INVENTORY.md`** — added 5-line "spec has moved" banner
- **MODIFIED: 6 project-local skills** — added `last-verified: 2026-06-13` + `applies-to-rounds: 6.0+` to frontmatter

## Files touched

- `HKIAL/spec.md` (new, 1324 lines)
- `HKIAL/.hermes/scripts/spec-audit.sh` (new, 180 lines, executable)
- `HKIAL/handoff/` (new folder)
- `HKIAL/handoff/2026-06-13-spec-consolidation.md` (new, this file)
- `HKIAL/AGENTS.md` (modified, +5 lines §9)
- `HKIAL/README.md` (modified, +1 row orientation table)
- `HKIAL/references/pointer-index.md` (modified, +1 row §1)
- `HKIAL/skills/hkial-setup-onboarding/SKILL.md` (modified, +2 lines frontmatter)
- `HKIAL/skills/hkial-container-view-pattern/SKILL.md` (modified, +2 lines frontmatter)
- `HKIAL/skills/hkial-pre-commit-gate/SKILL.md` (modified, +2 lines frontmatter)
- `HKIAL/skills/hkial-frontend-disambiguation/SKILL.md` (modified, +2 lines frontmatter)
- `HKIAL/skills/hkial-azure-deploy/SKILL.md` (modified, +2 lines frontmatter)
- `HKIAL/skills/hkial-handoff-discipline/SKILL.md` (modified, +2 lines frontmatter)
- `backend/spec.md` (modified, +10 lines redirect banner)
- `frontend_react/frontend/PROJECT_SUMMARY.md` (modified, +3 lines banner)
- `frontend_react/frontend/DEVELOPMENT_GUIDE.md` (modified, +3 lines banner)
- `frontend_react/frontend/BOOKING_VIEW_INVENTORY.md` (modified, +3 lines banner)
- `frontend_react/frontend/PROMO_CODE_INVENTORY.md` (modified, +3 lines banner)

## Pre-existing fails noted

- 3 P0 bugs in spec §14.1 (B1 multi-kind NFG over-bill, B2 customer edit no re-price, B3 boolean columns silently dropped) — INTENDED, pinned by `BookingDeepAuditTest`
- 11 medium + 8 low issues in spec §14.2-3 — INTENDED, audit report
- 6 pending design Q&A in spec §14.4 — INTENDED, 7-day TTL applies
- 17 rot items in spec §14.5 — INTENDED, action items

## Audit baseline (first run of spec-audit.sh)

- **Customer**: 4 handoffs ✓
- **Admin**: 9 handoffs ✓
- **API**: 0 handoffs (no dir yet — expected per spec §13.2)
- **Pending**: 6 pending-changes (at the limit; Q-F Edit Booking coverage plan is the canary)
- **Cross**: 0 cross-project handoffs (this file is #1)
- **figma-ui admin**: DIRTY (5 modified files: BookingDetail, CreateBooking, BookingCustomerProfile, BookingDetailMocks, BookingEditDialog) — matches the handoffs noting "uncommitted patches across 3 sessions"
- **figma-ui customer**: CLEAN ✓
- **Skills**: 6 project-local verified (2026-06-13), 8 global still missing `last-verified`, 2 global missing version
- **INV count**: 10 cross-project + 13 backend = 23 total ✓
- **Spec freshness**: 0 days old ✓

## Deploy reminder for Sky

No deploy needed — this round is documentation-only, no code changes. Next code round (round 7.0?) should:
- [ ] Pick a delivery scope from spec §14.1 (B1 / B2 / B3)
- [ ] Follow the new dev order in spec §15 (SPEC → SCHEMA → CONTRACT → IMPL → FRONTEND → E2E)
- [ ] Add `last-verified: YYYY-MM-DD` to 8 global HKIAL skills (the audit will catch any missed)
- [ ] Add `version: <X.Y.Z>` to 2 unversioned global skills (hkial-debugging-stuck-loop, hkial-frontend-e2e-selector-pattern)
- [ ] Optional: run `bash HKIAL/.hermes/scripts/spec-audit.sh` before committing to catch drift

## Follow-ups

- **Q-G (new)**: 8 global skills still need `last-verified` stamp — out of scope for this round (they're in `~/.hermes/`, not under Sky's git)
- **Q-H (new)**: 2 unversioned global skills need a version — same as Q-G
- **Q-I (new)**: `backend/spec.md` (legacy, 747 lines) is still valuable for the admin UI design system (colors, typography, sidebar, page-by-page specs) — keep as-is, do not delete
- **Q-J (new)**: figma-ui admin has 5 uncommitted dirty files — see pending Q-F (Edit Booking coverage) for the cleanup scope
- **Q-K (new)**: `HKIAL/handoff/README.md` index should be created when the 2nd cross-project handoff lands (next deploy handoff would be a good candidate)
- **Round 7.0 question**: should the next round use the new dev order (spec §15) end-to-end on a single feature? E.g. close B2 (customer edit re-price, 15 min) using the new protocol as a pilot? This would test the protocol before betting on it for a bigger feature.

## Self-critique (5 known-shortcut / silent-regression risks)

1. **The spec is 1324 lines — itself a rot risk**. To stay maintainable, every delta goes at the END of the relevant section (spec §0.3 update rule). Quarterly audit catches bloat. The old `backend/spec.md` was 747 lines and got stale; the new one is bigger.
2. **The §14 LIVE STATE requires manual update on every round**. If a round closes a bug but forgets to move the row, the next session's audit will think the bug is still open. The spec-audit script catches this implicitly (test baseline check) but not directly. Could add a §14 date stamp to the spec-audit script's output.
3. **The 6 project-local skills got `last-verified: 2026-06-13` but the underlying methodology hasn't been re-verified in detail** — the stamp means "I read this skill today and it still applies", not "I exercised this skill in a real session". A future round should validate the stamps by actually using each skill.
4. **The dev order (§15) is aspirational, not enforced**. The next code round needs to validate the 5 phases on a real feature. Until then, §15 is a target, not a process.
5. **The audit script has §3 (test baseline) running `php artisan test` which can take 30-60 seconds**. For a quarterly audit that's fine; for a per-commit gate, that would be too slow. The script is positioned as quarterly, not per-commit. A separate per-commit script could be added (running just the 1 sample test from spec §12 Phase 3).

## Next steps (Sky's call)

Per HKIAL/AGENTS.md §8 "fix it as your best" — here are 3 questions for you to pick from:

1. **Q1 (5 min)**: Add `last-verified: 2026-06-13` + `version: 1.0.0` to the 8 unversioned / stale-stamp global skills in `~/.hermes/skills/software-development/hkial*/`. Zero risk.
2. **Q2 (15 min)**: Use the new dev order (§15) to fix B2 (customer edit re-price, the 1-line `apply()` call) end-to-end as a pilot. Tests the new protocol on a small feature.
3. **Q3 (1-2 hours)**: Same as Q2, but fix all 3 P0 bugs (B1 + B2 + B3) end-to-end. Validates the protocol on a medium feature.
4. **Q4 (3-4 hours)**: Same as Q3, plus add Playwright E2E for the customer create+edit flow (per spec §10 of the round 6.2.39 deep audit). Validates the protocol on a full feature with browser-level verification.
5. **Q5 (defer)**: Ship the spec + audit script as-is. No code changes. Next code round uses the spec when it lands.
