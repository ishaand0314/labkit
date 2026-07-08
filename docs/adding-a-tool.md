# Adding a tool (your daily ritual)

Each day is the same five moves. Budget ~20 min of setup, then build.

## 1. Scaffold the package

```bash
mkdir -p packages/<tool>/src packages/<tool>/test
```

Copy `packages/token-cost/package.json` and `tsconfig.json` as a starting
point; change `name`, `description`, and the `bin` key.

## 2. Wire references

- In `packages/<tool>/tsconfig.json`, keep `"references": [{ "path": "../core" }]`.
- In the **root** `tsconfig.json`, add `{ "path": "./packages/<tool>" }`.
- In `vitest.config.ts`, add a source alias if the tool is imported by others.

## 3. Build the library first, CLI second

Put the real logic in `src/index.ts` as pure, typed functions. Keep `src/cli.ts`
a thin wrapper that calls `cli.run(...)` from `@labkit/core`.

## 4. Write tests as the spec

Before implementing, write the tests that define "done". Let Claude Code fill in
the implementation until `pnpm test` is green.

## 5. Promote shared knowledge to core

If you wrote anything another tool will need (a lab's message shape, a schema
map), move it into `@labkit/core`. That's what makes tomorrow faster.

## Ship checklist

- [ ] `pnpm build` green
- [ ] `pnpm lint` green
- [ ] `pnpm test` green
- [ ] Package `README.md` with a one-line pitch + usage example + one screenshot
- [ ] LinkedIn post drafted (problem → what you built → one honest limitation)
