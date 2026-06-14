# HKIAL Project-Local Skills

> **Auto-load**: All skills in this folder are auto-loaded by any opencode session that opens `~/Desktop/Projects/HKIAL/` as workspace (see `.hermes/config.yaml`). Subproject sessions do NOT auto-load these — they have their own AGENTS.md + Hermes skills.
>
> **Format**: Each skill is a folder with `SKILL.md` (YAML frontmatter + markdown body). The frontmatter has `name`, `description`, `tags`, `version`, `metadata.hermes.tags`. The body is the actual cookbook.
>
> **Relationship to global Hermes skills**: The 6 skills here cover **cross-project HKIAL workflows** (the things that span all 3 subprojects). Per-subproject details (Container/View, figma-ui sync, bug classes, etc.) are in `~/.hermes/skills/software-development/hkial*/` — the global Hermes skills.

## Skills index (6 skills, one per SDLC stage)

| Stage | Skill | What it covers |
|---|---|---|
| **Setup** | [`hkial-setup-onboarding`](./hkial-setup-onboarding/SKILL.md) | Clone + submodule init + .env + local dev (3000/5173/8000) + port mismatch fix |
| **Develop** | [`hkial-container-view-pattern`](./hkial-container-view-pattern/SKILL.md) | Container/View canonical pattern (customer + admin) + MOCK_* + inverse sub-pattern |
| **Test** | [`hkial-pre-commit-gate`](./hkial-pre-commit-gate/SKILL.md) | 4-phase pre-commit gate (lint, sample, full, runtime) per subproject |
| **Debug** | [`hkial-frontend-disambiguation`](./hkial-frontend-disambiguation/SKILL.md) | 30-sec recipe: which frontend is the user reporting on? Bundle-grep discriminator |
| **Deploy** | [`hkial-azure-deploy`](./hkial-azure-deploy/SKILL.md) | 3-app Azure docker buildx + push + restart + port mapping |
| **Handoff** | [`hkial-handoff-discipline`](./hkial-handoff-discipline/SKILL.md) | `docs/handoff/<date>-<task>.md` template + 3 subproject locations |

## Skill relationship to existing global skills

| This folder's skill | Closest global Hermes skill (if any) | Why both? |
|---|---|---|
| `hkial-setup-onboarding` | (none — gap) | Setup is HKIAL-specific (3 subprojects, 3 envs, port-mismatch gotcha) |
| `hkial-container-view-pattern` | `hkial-customer-frontend-figma-codebase-sync` (v1.24.0) | Project-local = canonical pattern; global = sync playbook with worked examples |
| `hkial-pre-commit-gate` | `contract-test-first-workflow` (12 anti-patterns) | Project-local = operational 4-phase gate; global = the methodology |
| `hkial-frontend-disambiguation` | `hkial-frontend-bug-debug-checklist` §"When the user reports on admin" | Project-local = the 30-sec recipe; global = full bug-class index |
| `hkial-azure-deploy` | (none — gap) | Deploy is HKIAL-specific (3 apps, ACR, cross-compile from M4) |
| `hkial-handoff-discipline` | (none — gap) | Handoff is HKIAL-specific (3 subproject locations, round-numbering) |

## How to add a new skill to this folder

1. Create a new folder: `mkdir -p HKIAL/skills/<skill-name>/`
2. Create `SKILL.md` with the YAML frontmatter + body
3. Add 1 row to this index
4. Add the skill name to `.hermes/config.yaml` `auto_load_skills:`
5. Add 1 row to `HKIAL/AGENTS.md` §6 (project-local skills table)

## How to use a skill from a subproject session

The skills in this folder are auto-loaded ONLY when the workspace is `~/Desktop/Projects/HKIAL/`. If you're in `frontend_react/`, `backend/`, or any subproject, you can still load a specific skill by name:

```bash
# opencode CLI (if supported)
opencode --skill hkial-frontend-disambiguation

# Or read directly
cat ~/Desktop/Projects/HKIAL/skills/hkial-frontend-disambiguation/SKILL.md
```

For now, the simplest is to open the session at `~/Desktop/Projects/HKIAL/` (cross-project sessions) and let the auto-load pick them up.

## Versioning

Each skill has a `version:` field in its YAML frontmatter. Bump on material changes (new class, new pattern, new round example).

| Skill | Version | Last updated |
|---|---|---|
| `hkial-setup-onboarding` | 1.0.0 | 2026-06-12 |
| `hkial-container-view-pattern` | 1.0.0 | 2026-06-12 |
| `hkial-pre-commit-gate` | 1.0.0 | 2026-06-12 |
| `hkial-frontend-disambiguation` | 1.0.0 | 2026-06-12 |
| `hkial-azure-deploy` | 1.0.0 | 2026-06-12 |
| `hkial-handoff-discipline` | 1.0.0 | 2026-06-12 |
