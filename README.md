# Web Application Template

Opinionated React + TypeScript starter built with Vite, TanStack Router, TanStack Query, Tailwind CSS v4, shadcn/ui, and Supabase.

## Stack

- Vite
- React 19
- TypeScript
- TanStack Router with file-based routes
- TanStack Query
- Tailwind CSS v4
- shadcn/ui
- Supabase

## Requirements

- Node.js 20+
- npm 10+
- Optional: Supabase CLI for local database and auth workflows

## Quick Start

```bash
npm install
npm run dev
```

The app runs on Vite's default dev server URL, usually `http://localhost:5173`.

If you are using Supabase, copy `.env.example` to `.env` and add your project values.

## Scripts

- `npm run dev` starts the Vite dev server
- `npm run build` type-checks and builds the app
- `npm run lint` runs ESLint across the repo
- `npm run preview` serves the production build locally
- `npm run prepare` installs Husky hooks

## Project Structure

```text
src/
  components/
    ui/                  # design-system primitives
    app/                 # shared app-level components
    shared/              # lightweight cross-feature components
  features/              # feature-owned UI, queries, hooks, schemas, types, utils
  hooks/                 # shared hooks
  lib/                   # shared infrastructure and utilities
  routes/                # route files and route structure
  test/                  # shared test utilities
  types/                 # shared domain types
  index.css              # global theme and styles
  main.tsx               # app bootstrap

supabase/
  config.toml            # local Supabase config
  functions/             # edge functions
  migrations/            # schema history
  seed.sql               # optional deterministic seed data
```

## Conventions

- Keep route files thin and move reusable logic into `src/features`.
- Prefer TypeScript throughout app code.
- Use the `@/` alias for imports from `src`.
- Reuse existing UI primitives before creating new abstractions.
- Do not manually edit `src/routeTree.gen.ts`.
- Add tests for new behavior, bug fixes, and non-trivial refactors when practical.

## Routing

- Route files live in `src/routes`.
- Keep root providers and global app wiring in `src/routes/__root.tsx`.
- TanStack Router generates `src/routeTree.gen.ts` from the route files.

Example route:

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return <div>Settings page</div>;
}
```

## Supabase Notes

- Treat `supabase/migrations` as the source of truth for schema changes.
- Create database changes through migrations, not only in the dashboard.
- Enable Row Level Security for application tables and add policies with the migration.
- Keep secrets out of frontend code and out of `VITE_` environment variables.
- Use Edge Functions for privileged or secret-bearing workflows.

## Before Shipping Changes

When practical, run:

```bash
npm run lint
npm run build
```

If you changed schema or Supabase behavior, also confirm:

- a migration was added in `supabase/migrations`
- RLS and policies were included for application tables
- generated types were updated if the project uses them
