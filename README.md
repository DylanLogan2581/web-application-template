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
- Import features through public entrypoints like `@/features/<feature-name>`, not deep internal paths.
- Reuse existing UI primitives before creating new abstractions.
- Do not manually edit `src/routeTree.gen.ts`.
- Add tests for new behavior, bug fixes, and non-trivial refactors when practical.

## Linting Guardrails

- Pre-commit runs Prettier and ESLint on staged files through Husky and `lint-staged`.
- Commit messages are validated as semantic commits through Husky and `commitlint`.
- ESLint enforces import ordering, no duplicate imports, no circular imports, and `@/` aliases over parent relative imports inside `src`.
- Features should expose public `index.ts` entrypoints and be imported as `@/features/<feature-name>`.
- Keep direct data access out of routes and components: no direct `fetch` there, and no direct `@/lib/supabase` imports there.
- `createRouter` and `RouterProvider` belong in `src/main.tsx`. App-level providers like `QueryClientProvider` belong in `src/routes/__root.tsx`.
- `src/components/ui` follows shadcn-style kebab-case filenames. App/shared/feature component files use PascalCase.
- ESLint also enforces explicit TypeScript boundaries, accessibility basics, TanStack Query rules, and several restricted patterns such as `console.log`, `enum`, `for...in`, non-null assertions, and ad hoc browser persistence/time/random helpers in app code.

## Branch Workflow

- Do work on a branch and merge through a pull request. Do not plan on committing directly to `main`.
- Use short descriptive branch names such as `feat/auth-session`, `fix/query-loading-state`, or `chore/lint-rules`.
- `main` is protected with strict required checks for `Lint` and `Build`.
- `main` also requires 1 approving review, dismisses stale reviews after new pushes, and requires PR conversations to be resolved before merge.
- Force pushes and branch deletions are disabled on `main`.
- Admins are not fully locked out by branch protection, but the repo convention should still be to use branches and PRs.

## Routing

- Route files live in `src/routes`.
- Keep router creation and `RouterProvider` in `src/main.tsx`.
- Keep app-level providers and shared layout wiring in `src/routes/__root.tsx`.
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
