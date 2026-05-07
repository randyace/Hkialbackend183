# figma-ui fixtures

This directory holds **mock data** used **only by the figma-ui standalone preview** (the Vite/Make app that lives inside `figma-ui/`).

Rules:

- Page-level views in `figma-ui/src/app/components/` MUST be 100% props-driven (no `useState` for business data, no internal mock arrays).
- Mock data MUST live here, in `__fixtures__/<Page>.fixture.ts`.
- Only `figma-ui/src/app/routes.tsx` (or other standalone preview wrappers) may import from this folder.
- The production `hkial-react/src/components/*` smart containers MUST NOT import from this folder.
