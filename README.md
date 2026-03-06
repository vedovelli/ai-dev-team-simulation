🚨 **Muito importante**: este projeto não tem a finalidade de ser um projeto real, algo que possa ser executado e acessado no browser. Ele serve única e exclusivamente para simular um ciclo de desenvolvimento de software com dois desenvolvedores e um orquestrador. Todos os sinais gerados como issues, comentários, pull requests, code reviews são enviados para um produto que está em desenvolvimento.

# AI Dev Team Simulation

A web application that simulates a collaborative AI-powered software development team. Visualise agent roles, task queues, sprint boards, and real-time code generation workflows — all in the browser, with a fully mocked backend.

## Features (planned)

- **Agent Dashboard** — see each AI agent's current role, status, and output
- **Task Board** — kanban view of issues assigned to agents (TanStack Table + Virtual)
- **Sprint Planner** — create and assign tasks via TanStack Form
- **Live Feed** — real-time stream of agent actions and decisions
- **Mock API** — all data served via MSW; no backend required

## Tech Stack

| Layer          | Technology        |
| -------------- | ----------------- |
| Framework      | React 19 + Vite 6 |
| Language       | TypeScript 5      |
| Routing        | TanStack Router   |
| Data Fetching  | TanStack Query    |
| Tables         | TanStack Table    |
| Forms          | TanStack Form     |
| Virtualisation | TanStack Virtual  |
| Styling        | Tailwind CSS 4    |
| Mocking        | MSW 2             |

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

## Documentation

### Data Layer Architecture

- **[TanStack Data Layer Architecture](./docs/architecture/data-layer.md)** — Overview of Query → Table → Form flow, design decisions, and common patterns
- **[TanStack Query Guide](./docs/guides/tanstack-query.md)** — Server state management, query hooks, cache invalidation strategies
- **[TanStack Query Cache Invalidation & Optimistic Updates](./docs/guides/TANSTACK_QUERY_CACHE_INVALIDATION.md)** — Advanced patterns for cache management, invalidation strategies, and optimistic updates with rollback
- **[TanStack Table Guide](./docs/guides/tanstack-table.md)** — Building tables with sorting, filtering, selection, and customization
- **[TanStack Form Guide](./docs/guides/tanstack-form.md)** — Form state management, validation patterns, field types
- **[MSW Documentation](./docs/guides/msw-documentation.md)** — Mock handler structure, patterns, and testing strategies

### Code Examples

See `src/examples/` for working examples:
- `QueryExample.tsx` — Basic and filtered data fetching
- `TableExample.tsx` — Table creation and filtering
- `FormExample.tsx` — Form validation and submission

### TanStack Form Patterns

See [docs/TANSTACK_FORM_PATTERNS.md](./docs/TANSTACK_FORM_PATTERNS.md) for detailed patterns from existing forms.

## Contributing

See [CLAUDE.md](./CLAUDE.md) for code conventions.
Use GitHub Issues (bug / feature / task templates in `.github/ISSUE_TEMPLATE/`).
