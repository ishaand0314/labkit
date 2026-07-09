# labkit

**AI-adjacent tooling, made simple.** Small, single-purpose utilities that work across models from OpenAI, Anthropic, Google, xAI, and the open-weight world. They cover the boring seams the big gateways bundle and lock behind their client, shipped as standalone tools you can drop into any stack in five minutes.

## Why this exists

The unified-API / gateway space (LiteLLM, OpenRouter, Portkey…) is saturated and un-shippable in a day. But the *seams* between labs, like token accounting, message formats, tool schemas, and structured output, are inconsistent, and almost nobody ships them as clean, zero-config standalones. That's the gap this monorepo fills, one small tool at a time.

## The 7 tools

| Day | Package | What it does |
| --- | --- | --- |
| 1 | `@labkit/token-cost` | Token count + USD cost for the same text across 24 models and 5 labs, ranked cheapest first, with each model's known limitations next to the price. Exact OpenAI counts, honest estimates elsewhere (exact with free API keys) |
| 2 | `@labkit/format` | Convert between OpenAI / Anthropic / Gemini message formats |
| 3 | `@labkit/tool-schema` | Write one tool definition, emit every lab's schema |
| 4 | `@labkit/model-ref` | Always-current context windows, pricing, limits per lab |
| 5 | `@labkit/structured` | Reliable JSON-to-schema across labs |
| 6 | `@labkit/portable` | Move a live conversation losslessly between labs |
| 7 | `@labkit/guardrail` | Catch mid-task goal drift and re-ground the agent |

Only Day 1 ships in this template. Each following day adds one package — see [`docs/adding-a-tool.md`](docs/adding-a-tool.md).

## Quickstart

```bash
pnpm install
pnpm build        # build all packages (topological)
pnpm test         # run the suite (against source, no build needed)
pnpm lint         # biome check
pnpm typecheck    # tsc --build

# try Day 1:
node packages/token-cost/dist/cli.js estimate "your prompt here" --output 300
node packages/token-cost/dist/cli.js estimate --file prompt.txt
cat prompt.txt | node packages/token-cost/dist/cli.js estimate --json
```

No terminal handy? Open `packages/token-cost/playground/index.html` in a
browser for the same comparison, zero install.

## Structure

```
labkit/
├── packages/
│   ├── core/          # shared: provider registry, types, CLI router
│   └── token-cost/    # Day 1 tool (imports core)
├── docs/              # architecture + how to add a tool
├── vitest.config.ts   # aliases workspace pkgs to source for tests
├── tsconfig.base.json # strict TS config every package extends
└── biome.json         # one tool for lint + format
```

## The one rule that keeps this fast

**Shared knowledge lives in `@labkit/core`.** When Day 2 needs each lab's message shape, it goes in `core` so Day 3's tool-schema converter can reuse it. By Day 5 you're assembling from parts you already built, not starting over. See [`docs/architecture.md`](docs/architecture.md).

# CI workflow

The GitHub Actions CI (`.github/workflows/ci.yml`) is staged in
`.github/workflows-pending/ci.yml.txt`. It was not pushed automatically
because the push token lacked the `workflow` scope. To enable CI:

```bash
gh auth refresh -h github.com -s workflow   # authorize in browser
git mv .github/workflows-pending/ci.yml.txt .github/workflows/ci.yml
git commit -m "Add CI workflow" && git push
```
