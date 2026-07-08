# Architecture

## The compounding-core principle

Every tool is a thin package that imports `@labkit/core`. `core` holds the
knowledge that's shared across labs:

- **`types.ts`** — the shared vocabulary (`Lab`, `ModelInfo`, `CostEstimate`…).
  Because every tool speaks these types, tools compose without glue code.
- **`registry.ts`** — the cross-lab model registry (context windows, pricing,
  limits). One source of truth. Day 4's `model-ref` tool keeps it fresh.
- **`cli.ts`** — a zero-dependency CLI router so all seven CLIs share the same
  UX (`--json`, `--help`, consistent errors) without re-implementing parsing.

The payoff: Day 1 fills in the registry, Day 2 adds message-format adapters to
`core`, Day 3's tool-schema converter *reuses* those adapters. Later days get
faster because the shared layer is already there.

## Why these tool choices

- **pnpm workspaces** — fast, first-class monorepo support, topological builds.
- **TypeScript project references** — each package builds independently and
  incrementally; `core` builds before its dependents automatically.
- **Biome** — one fast binary for lint + format, instead of ESLint + Prettier.
- **Vitest** — fast, and aliased to source (`vitest.config.ts`) so tests run
  without a build and always reflect the latest code.
- **Strict everything** — `strict`, `noUncheckedIndexedAccess`,
  `verbatimModuleSyntax`. Strict types give Claude Code hard guardrails, so it
  builds each day's tool without drifting off the interfaces.

## Conventions

- Each package exposes a **library** (`index.ts`) and a **CLI** (`cli.ts`).
  The library is the product; the CLI is a thin shell over it.
- Pure functions, no hidden global state — makes everything trivially testable.
- Tests double as the spec: a package is "done" when its tests pass.
