# labkit

**See what a prompt costs across every major LLM provider, with each model's limitations right next to the price.** Token count and USD cost for the same text across 24 models and 5 labs (OpenAI, Anthropic, Google, xAI, and open-weight), ranked cheapest first. Exact OpenAI counts, honest estimates elsewhere, and exact Anthropic and Google counts when you set a free API key.

```bash
node packages/token-cost/dist/cli.js estimate "your prompt here" --output 300
node packages/token-cost/dist/cli.js estimate --file prompt.txt --notes
cat prompt.txt | node packages/token-cost/dist/cli.js estimate --json
```

No terminal handy? Open [`packages/token-cost/playground/index.html`](packages/token-cost/playground/index.html) in a browser for the same comparison, zero install. Full usage in the [token-cost README](packages/token-cost/README.md).

## Develop

```bash
pnpm install
pnpm build        # build all packages (topological)
pnpm test         # run the suite (against source, no build needed)
pnpm lint         # biome check
pnpm typecheck    # tsc --build
```

## Structure

The model registry, shared types, and CLI router live in `@labkit/core`; the
`token-cost` package is a thin CLI + library on top of it.

```
labkit/
├── packages/
│   ├── core/          # provider registry, types, CLI router
│   └── token-cost/    # the tool (imports core)
├── docs/              # architecture notes
├── vitest.config.ts   # aliases workspace pkgs to source for tests
├── tsconfig.base.json # strict TS config every package extends
└── biome.json         # one tool for lint + format
```

## License

MIT
