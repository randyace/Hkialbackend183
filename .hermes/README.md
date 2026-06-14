# HKIAL Project-Local Hermes State

> **Purpose**: This `.hermes/` directory holds HKIAL project-local Hermes state — separate from the global `~/.hermes/` (which holds global Hermes state and skills) and from any subproject's `.hermes/` (e.g. `backend/hkial-react/.hermes/plans/`).
>
> **Auto-load**: When any opencode session opens `~/Desktop/Projects/HKIAL/` as workspace, it auto-loads `MEMORY.md` (project-local memory) and `config.yaml` (skill auto-load config). Subproject sessions do NOT auto-load this — they have their own.

## File index

| File | Purpose | Auto-loaded? |
|---|---|---|
| `MEMORY.md` | Project-local memory (HKIAL-specific facts that don't belong in global Hermes memory) | Yes |
| `config.yaml` | Skill auto-load configuration (which skills to load when HKIAL/ is the workspace) | Yes |
| `channels/` | Optional: routing config for multi-channel (Telegram, WhatsApp) | No (Sky to add if needed) |

## Related

- Global Hermes: `~/.hermes/memories/MEMORY.md` + `~/.hermes/skills/`
- Subproject-local: `backend/hkial-react/.hermes/plans/` (admin-side plans)
- This folder: `~/Desktop/Projects/HKIAL/.hermes/` (project-local)
