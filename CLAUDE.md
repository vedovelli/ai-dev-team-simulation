# AI Dev Team Simulation — Claude Code Conventions

## Project Overview
A React SPA that simulates an AI-powered development team workflow. Built with Vite + React 19 + TypeScript.

## Tech Stack
| Layer | Library |
|---|---|
| Build | Vite 6 + @vitejs/plugin-react-swc |
| UI | React 19 |
| Language | TypeScript 5 (strict) |
| Routing | TanStack Router (file-based, `src/routes/`) |
| Server State | TanStack Query |
| Tables | TanStack Table |
| Forms | TanStack Form |
| Virtualisation | TanStack Virtual |
| Styling | Tailwind CSS 4 |
| API Mocking | MSW 2 |
| Linting | ESLint 9 flat config (`eslint.config.ts`) |
| Formatting | Prettier 3 (`.prettierrc`) |
| Package Manager | pnpm |

## Key Commands
```bash
pnpm dev          # dev server (MSW enabled automatically)
pnpm build        # tsc -b && vite build
pnpm preview      # preview production build
pnpm lint         # eslint with zero warnings
pnpm format       # prettier --write .
pnpm format:check # check formatting without writing
```

## File Conventions
- **Routes:** `src/routes/<name>.tsx` — TanStack Router auto-generates `src/routeTree.gen.ts` (do not edit)
- **API handlers:** `src/mocks/handlers.ts` — add MSW handlers here
- **Components:** `src/components/<FeatureName>/<ComponentName>.tsx`
- **Hooks:** `src/hooks/use<HookName>.ts`
- **Types:** `src/types/<domain>.ts`

## Code Style
- No semicolons, single quotes, 100 char line width (Prettier enforces)
- TypeScript strict mode — no `any`, no unused vars
- Named exports only (no default exports except route files)
- Co-locate tests with source: `src/components/Foo/Foo.test.tsx`

## MSW Usage
- Handlers live in `src/mocks/handlers.ts`
- MSW only starts in `import.meta.env.DEV`
- Use `http.get/post/put/delete` from `msw`, return `HttpResponse.json()`

## TanStack Router
- File-based routing: new page = new file in `src/routes/`
- Root layout: `src/routes/__root.tsx`
- Access QueryClient via router context: `const { queryClient } = Route.useRouteContext()`
- `routeTree.gen.ts` is auto-generated — never edit manually

## Git Conventions
- Branch naming: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`
- Commit format: `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`
- PRs must pass lint + type check before merge
