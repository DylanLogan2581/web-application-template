# AGENTS.md

This file is the working agreement for language models and coding agents in this repository. Use it as the default guide when writing, moving, or organizing code.

## Stack

This repository uses:

- Vite
- React 19
- TypeScript
- TanStack Router with file-based routes
- TanStack Query
- Tailwind CSS v4
- shadcn/ui
- Vitest
- Supabase

## Core Principles

- Prefer small, focused modules over large mixed-responsibility files.
- Keep route files thin and move reusable logic into feature modules.
- Prefer TypeScript everywhere in app code.
- Use the `@/` path alias for imports from `src`.
- Reuse existing UI primitives and helpers before creating new abstractions.
- Do not manually edit generated files such as `src/routeTree.gen.ts`.
- Add or update tests for new behavior, bug fixes, and non-trivial refactors.
- Keep secrets out of client code and out of `VITE_` environment variables.
- Prefer explicit, boring structure over clever one-off organization.
- Review all code changes for security implications before finishing work.

## Source of Truth

- `src/routes` is the source of truth for pages and route structure.
- `supabase/migrations` is the source of truth for database schema changes.
- `supabase/functions` is the source of truth for Edge Functions.
- Supabase Row Level Security is required for application tables.

## Branch Rules

- Work from a branch and merge through a pull request instead of planning on direct commits to `main`.
- Keep branch names short and descriptive, for example `feat/projects-list`, `fix/auth-redirect`, or `chore/eslint-docs`.
- `main` is protected by strict required checks named `Lint` and `Build`.
- `main` requires 1 approving review, dismisses stale reviews on new pushes, and requires conversation resolution before merge.
- Force pushes and deletions are disabled on `main`.
- Admins may still be able to bypass protection, but agents should treat the PR workflow as the default rule.

## Recommended Directory Structure

Follow this structure for new work:

```text
src/
  components/
    ui/                  # shadcn/ui primitives and low-level reusable UI
    app/                 # shared app-specific components used across features
    shared/              # small reusable components that are not design-system primitives
  features/
    <feature-name>/
      components/        # feature-specific UI
      hooks/             # feature-specific hooks
      queries/           # TanStack Query options and async data access
      schemas/           # zod schemas and validation
      types/             # feature-local TypeScript types
      utils/             # feature-local helpers
  hooks/                 # app-wide reusable hooks
  lib/                   # shared infrastructure, clients, and generic utilities
  routes/                # route files only
  styles/                # optional future shared styles beyond index.css
  test/                  # shared test setup, utilities, and fixtures
  types/                 # shared domain types
  main.tsx               # app bootstrap
  index.css              # global styles and theme

supabase/
  config.toml            # local Supabase config
  functions/
    <function-name>/
      index.ts           # one function per directory
    _shared/             # optional shared server-only helpers
  migrations/            # SQL migrations, committed to git
  seed.sql               # optional deterministic local seed data
```

## Naming Conventions

- Use kebab-case for route file names. `index.tsx` and `__root.tsx` are the allowed special cases.
- Use PascalCase for React components.
- Use camelCase for functions, variables, hooks, and query helpers.
- Name feature folders after product concepts such as `projects`, `tasks`, `billing`, or `auth`.
- Prefer singular names for component files and plural names for feature areas when they model collections.
- Keep `src/components/ui` on shadcn-style kebab-case filenames. Use PascalCase for app/shared/feature component files.

## What Goes Where

### Routes

- Put route files in `src/routes`.
- A route file should define the route and compose page-level modules.
- Avoid putting large forms, complex query logic, or reusable components directly in route files.
- When a route grows beyond a small page component, move feature logic into `src/features/<feature-name>`.

### Components

- Put base UI primitives in `src/components/ui`.
- Put shared app-level components in `src/components/app`.
- Put reusable but lightweight cross-feature components in `src/components/shared`.
- Put feature-owned UI in `src/features/<feature-name>/components`.

### Data and Queries

- Put shared clients and generic helpers in `src/lib`.
- Keep Supabase client setup in shared infrastructure code such as `src/lib/supabase.ts`.
- Put feature-specific server state logic in `src/features/<feature-name>/queries`.
- Prefer TanStack Query for async state instead of manual fetch logic inside components.
- Do not call `fetch` directly in routes or components.
- Centralize query keys and query option builders so invalidation stays consistent.
- Keep raw database access near query modules, not scattered across route components.
- Do not import `@/lib/supabase` directly into routes or components. Go through feature query modules.
- If a route needs data immediately, prefer route-level preload or query prefetch patterns instead of duplicating loading logic in child components.

### Tests

- Use Vitest for unit and integration tests.
- Add tests alongside the code they cover when practical, using filenames like `*.test.ts` and `*.test.tsx`.
- Shared test utilities, common mocks, and setup code should live in `src/test`.
- New features should include tests for key behavior.
- Bug fixes should include a regression test whenever practical.
- If a change is hard to test automatically, document that clearly in the handoff.
- Test query helpers, validation schemas, and state transitions, not only rendered markup.
- For routes, prefer testing the route behavior and data states rather than snapshot-heavy tests.
- For utility functions and schema logic, default to fast isolated Vitest unit tests.

### Forms and Validation

- Put zod schemas in `src/features/<feature-name>/schemas`.
- Keep validation close to the feature that owns it.
- Reuse schemas between forms and server boundaries when practical.

### Types

- Put shared domain types in `src/types`.
- Put feature-only types in `src/features/<feature-name>/types`.
- Avoid large catch-all type files.

### Edge Functions

- Put each Edge Function in `supabase/functions/<function-name>/index.ts`.
- Keep each function responsible for one clear task.
- Use Edge Functions for secret-bearing logic, webhooks, background integrations, and privileged server-side operations.
- Validate Edge Function input explicitly before doing database or third-party work.
- Keep shared server-only helpers in `supabase/functions/_shared` if multiple functions need them.
- Do not move service-role logic into the browser app.

### Environment Variables

- Only browser-safe variables may use the `VITE_` prefix.
- Never expose service-role keys or third-party secrets in frontend code.
- If a secret is required at runtime, move the operation to an Edge Function.
- Keep environment variable access centralized when practical so missing config is easy to detect.

## Routing Conventions

- This app uses TanStack Router file-based routing.
- Add new route files under `src/routes`.
- Create the router and render `RouterProvider` only in `src/main.tsx`.
- Keep app-level providers and shared layout wiring in `src/routes/__root.tsx`.
- Let the router plugin generate `src/routeTree.gen.ts`.
- Do not hand-edit `src/routeTree.gen.ts`.
- Prefer route modules to compose features rather than own all business logic.
- Keep auth checks, redirects, and route guards close to the route boundary.

## Lint-Enforced Constraints

- Use the `@/` alias instead of parent relative imports inside `src`.
- Keep imports ordered, deduplicated, and acyclic.
- Import features only through public entrypoints such as `@/features/<feature-name>`, not internal subpaths.
- Keep `src/components/ui` low-level. UI primitives must not depend on routes, features, app/shared components, or the Supabase client.
- Create `QueryClient` and render `QueryClientProvider` only in the approved root/provider setup.
- Use function declarations for named React components.
- Prefer `type`, `import type`, explicit return types, and exhaustive `switch` handling for unions.
- Avoid `any`, non-null assertions, `console.log`, `enum`, `for...in`, and `with`.
- Avoid direct `window.location` writes, `localStorage`, `Date.now`, `new Date`, and `Math.random` in app code.
- Avoid `JSON.parse`, `JSON.stringify`, `setTimeout`, and `setInterval` in routes/components unless moved behind dedicated helpers or hooks.

## UI and Styling Conventions

- Use Tailwind utilities for most styling.
- Prefer existing shadcn/ui primitives before introducing new base UI patterns.
- If markup or styling repeats, extract a component instead of duplicating it.
- Keep visual changes aligned with the app’s existing direction unless a redesign is requested.
- Preserve accessibility when composing primitives: use semantic HTML, labels, keyboard support, and visible focus states.
- Prefer building on the existing design tokens in `src/index.css` instead of hardcoding one-off colors and spacing values.

## Database Schema Workflow

Database changes must be made through migrations, not only through the Supabase dashboard.
Row Level Security must be enabled for application tables.

### Required Process

1. Create a migration:

```bash
supabase migration new <short_descriptive_name>
```

2. Edit the generated SQL file in `supabase/migrations/`.

3. Include all related schema concerns in the migration when relevant:
   - tables
   - columns
   - indexes
   - constraints
   - foreign keys
   - RLS enablement
   - RLS policies
   - functions and triggers

4. If the app uses generated database types, regenerate them after schema changes and commit the updated type file.

Example:

```bash
supabase gen types typescript --local > src/lib/database.types.ts
```

5. Test locally by rebuilding the local database from migrations:

```bash
supabase db reset
```

6. When working with a linked remote project, push committed migrations:

```bash
supabase db push
```

7. If the remote schema was changed outside local migrations, pull those changes into migration files before continuing:

```bash
supabase db pull
```

### Migration Rules

- Treat `supabase/migrations` as the canonical schema history.
- Keep migrations forward-only.
- Use descriptive names such as `create_profiles_table` or `add_status_to_orders`.
- Keep one logical schema change per migration when possible.
- Enable RLS on every application table.
- Include RLS policies in the same migration that introduces the table.
- Add indexes for columns used in joins, filtering, uniqueness, and ordering when the feature depends on them.
- If local development needs seed data, keep it deterministic in `supabase/seed.sql`.

## Supabase Usage Guidance

- Keep anonymous browser-client access limited to user-safe operations.
- Wrap feature data access in query modules or dedicated helpers instead of calling Supabase ad hoc throughout the UI.
- Prefer typed database access if generated Supabase types are available.
- Keep auth-aware logic close to the feature or route that needs it.
- If a workflow requires elevated privileges, implement it in an Edge Function, not in the client.
- Never ship a schema change that creates an application table without RLS and appropriate policies.

## Security Review Guidance

- Review every change for authentication, authorization, input validation, secret handling, and data exposure risks.
- Assume any client input is untrusted and validate it at the appropriate boundary.
- Check whether new routes, queries, mutations, and Edge Functions expose data a user should not access.
- Prefer least-privilege access patterns for database queries, policies, and external integrations.
- If a change touches auth, payments, file uploads, webhooks, or privileged operations, do an extra security pass before finishing.

## Code Style Guidance

- Prefer named exports.
- Prefer composition over deeply nested abstractions.
- Keep helpers small and purpose-specific.
- Move business logic out of presentational components when it starts to grow.
- Keep async logic centralized in query modules, server helpers, or Edge Functions where appropriate.
- Prefer code that is straightforward to test with Vitest.
- Favor pure functions for transformations and validation where practical.
- Avoid giant “utils” files; place helpers near the feature that owns them unless they are genuinely shared.

## Before Finishing

- Run `npm run lint` after code changes when practical.
- Run `npm run build` when changes affect routing, typing, or bundling.
- Run Vitest for the affected area when tests exist.
- If route files changed, make sure generated routing output is current.
- If schema changed, confirm a migration file exists and is committed.
- Confirm new behavior has test coverage, or explicitly note why it does not.
- If schema changed, confirm any generated database types were updated if the project uses them.
- Confirm the change was reviewed for security implications.
- If schema changed, confirm RLS is enabled and policies were added or updated appropriately.

## Quick Placement Rules

When in doubt:

- pages go in `src/routes`
- reusable UI goes in `src/components`
- feature logic goes in `src/features`
- shared infrastructure goes in `src/lib`
- Edge Functions go in `supabase/functions`
- schema changes go in `supabase/migrations`

Keep the repository easy to scan, easy to maintain, and easy for future agents to extend safely.
