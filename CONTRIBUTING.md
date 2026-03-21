# Contributing

Thanks for contributing to this project.

This repository is intentionally opinionated. The goal is to keep the codebase easy to scan, safe to change, and predictable for both human contributors and coding agents. Please read this guide before opening a pull request.

## Table of Contents

1. [Getting Started](#getting-started)
1. [Development Workflow](#development-workflow)
1. [Branching and Pull Requests](#branching-and-pull-requests)
1. [Code and File Conventions](#code-and-file-conventions)
1. [Database and Supabase Changes](#database-and-supabase-changes)
1. [Testing and Validation](#testing-and-validation)
1. [Security Expectations](#security-expectations)
1. [Documentation Expectations](#documentation-expectations)
1. [Change Checklists](#change-checklists)

## Getting Started

### Requirements

- Node.js 20+
- npm 10+
- Optional: Supabase CLI for local schema, auth, and migration workflows

### Local Setup

1. Fork or clone the repository.
1. Install dependencies:

```bash
npm install
```

1. Start the development server:

```bash
npm run dev
```

If you are working with Supabase locally, copy `.env.example` to `.env` and set the project-specific values you need.

## Development Workflow

### Core Commands

- `npm run dev`: start the Vite dev server
- `npm run lint`: run repo linting for code, docs, and SQL formatting checks
- `npm run build`: type-check and build the app
- `npm run preview`: preview the production build locally

### Pre-commit Behavior

This repository uses Husky with `lint-staged`.

On commit, staged files are checked with:

- Prettier for supported staged file types
- ESLint with autofix for staged `ts` and `tsx` files

That means some issues are fixed automatically, but commits still fail when remaining lint errors cannot be auto-fixed.

### Commit Message Format

This repository also validates commit messages with Husky and `commitlint`.

Use semantic commits that follow the Conventional Commits format:

- `feat(auth): add session refresh`
- `fix(router): handle missing route params`
- `docs(readme): update setup instructions`
- `chore(deps): refresh lint rules`

Commit messages must:

- use one of the standard conventional types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`
- include both a type and a scope
- stay within the configured header max length
- use lowercase casing
- avoid a trailing period in the subject

For example, `feat(auth): add password reset flow` passes, while `feat: Add password reset flow.` fails.

## Branching and Pull Requests

### Branch Rules

Do not plan on working directly on `main`.

Use a branch for each change. Keep names short and descriptive, for example:

- `feat/auth-session`
- `fix/query-loading-state`
- `chore/eslint-docs`

### Main Branch Protection

The `main` branch is protected on GitHub.

Current rules:

- required status checks: `Lint` and `Build`
- strict status checks enabled
- 1 approving review required
- stale reviews dismissed after new pushes
- conversation resolution required before merge
- force pushes disabled
- branch deletions disabled

Admins may still be able to bypass protection, but the expected workflow for contributors and agents is still branch -> pull request -> review -> merge.

### Pull Request Expectations

Keep pull requests focused and easy to review.

Good pull requests:

- solve one logical problem
- explain what changed and why
- describe how the change was validated
- call out schema, security, or environment impacts clearly

Prefer small and medium PRs over large mixed changes.

## Code and File Conventions

These are the contributor-facing highlights. For the full working agreement, also read `AGENTS.md`.

### Imports and Boundaries

- Use the `@/` alias for imports from `src`.
- Do not use deep parent-relative imports inside `src` when the alias would work.
- Import features through public entrypoints such as `@/features/<feature-name>`.
- Do not import feature internals from paths like `@/features/<feature-name>/queries/...`.

### Routes and Features

- Keep route files thin.
- Put reusable or growing route logic into `src/features/<feature-name>`.
- Keep router creation and `RouterProvider` in `src/main.tsx`.
- Keep app-level providers and shared layout wiring in `src/routes/__root.tsx`.

### Components

- `src/components/ui` is for low-level UI primitives.
- Keep `src/components/ui` independent of routes, features, app/shared components, and the Supabase client.
- `src/components/ui` uses shadcn-style kebab-case filenames such as `button.tsx`.
- App/shared/feature component files use PascalCase.

### Data Access

- Prefer TanStack Query for async state.
- Put feature-specific query logic in `src/features/<feature-name>/queries`.
- Do not call `fetch` directly in routes or components.
- Do not import `@/lib/supabase` directly into routes or components. Go through feature query modules.

### TypeScript Style

- Prefer `type` over `interface` unless TypeScript requires interface merging.
- Prefer `import type` for type-only imports.
- Prefer explicit return types for exported/shared functions.
- Avoid `any` and non-null assertions.
- Prefer exhaustive `switch` handling for discriminated unions.

### Restricted Patterns

The lint rules intentionally block some patterns to keep the codebase predictable:

- `console.log`
- `enum`
- `for...in`
- direct `window.location` writes
- direct `localStorage` access in app code
- ad hoc `Date.now()`, `new Date()`, and `Math.random()` in app code
- raw `JSON.parse`, `JSON.stringify`, `setTimeout`, and `setInterval` in routes/components

If you hit one of these rules, the intended fix is usually to move the behavior behind a helper, query module, hook, or infrastructure boundary.

## Database and Supabase Changes

Database changes must be made through migrations, not only through the Supabase dashboard.

When you change schema:

1. Create a migration:

```bash
supabase migration new <short_descriptive_name>
```

1. Edit the generated SQL file in `supabase/migrations/`.
1. Include related indexes, constraints, foreign keys, RLS enablement, and policies in the same migration when relevant.
1. If the project uses generated database types, regenerate them and commit the updated file.
1. Test locally when practical:

```bash
supabase db reset
```

Never ship a new application table without RLS and appropriate policies.

## Testing and Validation

Before opening a PR, run the checks that fit your change.

Usually:

```bash
npm run lint
npm run build
```

Also run targeted tests when they exist and are relevant.

Examples:

- route or UI behavior change: run relevant Vitest coverage if present
- schema change: verify the migration and local reset flow
- infrastructure change: confirm types, linting, and build output still pass

## Security Expectations

Every change should get a basic security review.

Pay extra attention to:

- authentication and authorization
- input validation
- secret handling
- data exposure
- Supabase policies and access patterns
- privileged behavior in Edge Functions

Never expose service-role keys or other secrets in frontend code or in `VITE_` variables.

## Documentation Expectations

Update documentation when behavior, workflow, or structure changes in a way future contributors need to know.

Most commonly:

- update `README.md` for setup, scripts, or contributor workflow changes
- update `AGENTS.md` when the code organization or working rules change
- document testing gaps or manual validation in the PR description when automation is not practical

## Change Checklists

### All Changes

- [ ] The change is scoped to one logical concern.
- [ ] Code follows the repo structure and import boundaries.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes when relevant.
- [ ] Documentation was updated when needed.
- [ ] The change was reviewed for security implications.

### UI or Route Changes

- [ ] Route files stay thin and compose feature modules when needed.
- [ ] Accessibility and keyboard behavior were considered.
- [ ] Visual changes are consistent with the existing direction unless redesign is intended.
- [ ] Screenshots or notes are included in the PR when helpful.

### Data or Query Changes

- [ ] Async data access is centralized in query modules or helpers.
- [ ] Routes/components do not reach directly into infrastructure when a feature boundary should own the logic.
- [ ] Cache keys and invalidation behavior are clear and consistent.

### Schema or Supabase Changes

- [ ] A migration file was added or updated in `supabase/migrations`.
- [ ] RLS and policies were added or updated where needed.
- [ ] Generated database types were updated if applicable.
- [ ] Local reset or schema validation was performed when practical.
