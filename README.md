# AI Dev Team Simulation

A web application that simulates a collaborative AI-powered software development team. Visualise agent roles, task queues, sprint boards, and real-time code generation workflows — all in the browser, with a fully mocked backend.

## Features (planned)
- **Agent Dashboard** — see each AI agent's current role, status, and output
- **Task Board** — kanban view of issues assigned to agents (TanStack Table + Virtual)
- **Sprint Planner** — create and assign tasks via TanStack Form
- **Live Feed** — real-time stream of agent actions and decisions
- **Mock API** — all data served via MSW; no backend required

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 6 |
| Language | TypeScript 5 |
| Routing | TanStack Router |
| Data Fetching | TanStack Query |
| Tables | TanStack Table |
| Forms | TanStack Form |
| Virtualisation | TanStack Virtual |
| Styling | Tailwind CSS 4 |
| Mocking | MSW 2 |

## Getting Started

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9

### Install
```bash
pnpm install
```

### Dev
```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). The mock API starts automatically via MSW.

### Build
```bash
pnpm build
pnpm preview
```

### Lint & Format
```bash
pnpm lint
pnpm format
```

## Project Structure
```
src/
├── routes/          # TanStack Router pages (file-based)
├── components/      # Reusable UI components
├── hooks/           # Custom React hooks
├── mocks/           # MSW handlers and browser worker
└── types/           # Shared TypeScript types
```

## Contributing
See [CLAUDE.md](./CLAUDE.md) for code conventions.
Use GitHub Issues (bug / feature / task templates in `.github/ISSUE_TEMPLATE/`).
