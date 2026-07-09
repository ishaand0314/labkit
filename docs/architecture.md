# Architecture

## The compounding-core principle

Every tool is a thin package that imports `@labkit/core`. `core` holds the
knowledge that's shared across labs:

- **`types.ts`**: the shared vocabulary (`Lab`, `ModelInfo`, `CostEstimate`, and
  friends). Because every tool speaks these types, tools compose without glue code.
- **`registry.ts`**: the cross-lab model registry (context windows, pricing,
  limits). One source of truth. The planned `model-ref` tool keeps it fresh.
- **`cli.ts`**: a zero-dependency CLI router so every CLI shares the same
  UX (`--json`, `--help`, consistent errors) without re-implementing parsing.

The payoff: the registry lives in `core`, message-format adapters land in `core`,
and the tool-schema converter *reuses* those adapters. Each new tool assembles
from parts that already exist, so the shared layer keeps the work compounding.

## Why these tool choices

- **pnpm workspaces**: fast, first-class monorepo support, topological builds.
- **TypeScript project references**: each package builds independently and
  incrementally, and `core` builds before its dependents automatically.
- **Biome**: one fast binary for lint + format, instead of ESLint + Prettier.
- **Vitest**: fast, and aliased to source (`vitest.config.ts`) so tests run
  without a build and always reflect the latest code.
- **Strict everything**: `strict`, `noUncheckedIndexedAccess`,
  `verbatimModuleSyntax`. Strict types give Claude Code hard guardrails, so it
  builds each day's tool without drifting off the interfaces.

## Conventions

- Each package exposes a **library** (`index.ts`) and a **CLI** (`cli.ts`).
  The library is the product; the CLI is a thin shell over it.
- Pure functions, no hidden global state, which makes everything trivially testable.
- Tests double as the spec: a package is "done" when its tests pass.
