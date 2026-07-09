# Architecture

## Shared core

The codebase is split into two packages. `@labkit/core` holds the knowledge that
is shared across labs, and `@labkit/token-cost` is a thin tool on top of it.

- **`types.ts`**: the shared vocabulary (`Lab`, `ModelInfo`, `CostEstimate`, and
  friends). One set of types keeps the registry, tokenizers, and CLI consistent.
- **`registry.ts`**: the cross-lab model registry (context windows, pricing,
  long-context tiers, per-model limitations). One source of truth.
- **`cli.ts`**: a zero-dependency CLI router that provides a consistent UX
  (`--json`, `--help`, consistent errors) so the CLI stays a thin shell.

Keeping this in `core` means the model data and CLI plumbing live in one place,
separate from the token-counting and pricing logic in `token-cost`.

## Why these tool choices

- **pnpm workspaces**: fast, first-class monorepo support, topological builds.
- **TypeScript project references**: each package builds independently and
  incrementally, and `core` builds before its dependents automatically.
- **Biome**: one fast binary for lint + format, instead of ESLint + Prettier.
- **Vitest**: fast, and aliased to source (`vitest.config.ts`) so tests run
  without a build and always reflect the latest code.
- **Strict TypeScript**: `strict`, `noUncheckedIndexedAccess`,
  `verbatimModuleSyntax`, so type errors surface at build time rather than in use.

## Conventions

- The package exposes a **library** (`index.ts`) and a **CLI** (`cli.ts`).
  The library is the product; the CLI is a thin shell over it.
- Pure functions, no hidden global state, which makes everything trivially testable.
- Tests double as the spec: the package is "done" when its tests pass.
